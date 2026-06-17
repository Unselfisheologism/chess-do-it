package expo.modules.focusshield

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// MARK: - FocusShieldModule
//
// Phase 4 implementation: Android AccessibilityService + ManagedSettings
// equivalent (SharedPreferences + the FocusShieldService that reads them).
//
// Mirrors the iOS Phase 3 surface as much as possible:
//   - getAuthorizationStatus / requestAuthorization
//   - clearShield
//   - unlockForDuration / getRemainingUnlockSeconds
//
// Adds three Android-only methods that the iOS side does not need
// (Apple's `ApplicationToken` is opaque; we use package-name strings here):
//   - getInstalledSocialApps
//   - setBlockedApps
//   - getBlockedApps
//
// State is stored in SharedPreferences with the keys below. The
// FocusShieldService reads the same keys on every TYPE_WINDOW_STATE_CHANGED
// event — so changes from JS are reflected on the very next foreground
// app switch. We do not need IPC between this Module and the Service.

class FocusShieldModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("FocusShield")

    // MARK: - Authorization

    AsyncFunction("getAuthorizationStatus") { promise: Promise ->
      promise.resolve(checkAuthStatus())
    }

    AsyncFunction("requestAuthorization") { promise: Promise ->
      val current = checkAuthStatus()
      if (current == "approved") {
        promise.resolve("approved")
        return@AsyncFunction
      }
      // We cannot programmatically enable an AccessibilityService —
      // the user must do it from Settings → Accessibility. Open
      // that screen for them.
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Cannot open Accessibility Settings without a foreground activity")
        return@AsyncFunction
      }
      try {
        activity.startActivity(
          Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        )
      } catch (e: Exception) {
        promise.reject("OPEN_FAILED", "Could not open Accessibility Settings: ${e.message}")
        return@AsyncFunction
      }
      // Return the current status — the user has to come back to the
      // app after enabling the service. JS can poll getAuthorizationStatus
      // or use addListener('authorizationChanged') (TODO: add a
      // settings-change receiver to push events).
      promise.resolve(current)
    }

    // MARK: - Shield management

    AsyncFunction("clearShield") { promise: Promise ->
      val prefs = sharedPrefs()
      prefs.edit()
        .remove(KEY_BLOCKED_PACKAGES)
        .remove(KEY_UNLOCKED_UNTIL)
        .apply()
      promise.resolve(null)
    }

    AsyncFunction("unlockForDuration") { durationSeconds: Double, promise: Promise ->
      if (durationSeconds <= 0) {
        promise.reject("INVALID_DURATION", "durationSeconds must be positive")
        return@AsyncFunction
      }
      val unlockedUntil = System.currentTimeMillis() + (durationSeconds * 1000).toLong()
      sharedPrefs().edit()
        .putLong(KEY_UNLOCKED_UNTIL, unlockedUntil)
        .apply()
      promise.resolve(null)
    }

    AsyncFunction("getRemainingUnlockSeconds") { promise: Promise ->
      val until = sharedPrefs().getLong(KEY_UNLOCKED_UNTIL, 0L)
      if (until <= 0L) {
        promise.resolve(0.0)
        return@AsyncFunction
      }
      val remainingMs = until - System.currentTimeMillis()
      promise.resolve(if (remainingMs > 0) remainingMs / 1000.0 else 0.0)
    }

    // MARK: - Android-only: package-name-based blocking

    AsyncFunction("getInstalledSocialApps") { promise: Promise ->
      try {
        val pm = appContext.reactContext?.packageManager
          ?: throw IllegalStateException("reactContext is null")
        val apps = queryInstalledApps(pm)
        promise.resolve(apps)
      } catch (e: Exception) {
        promise.reject("QUERY_FAILED", "Could not list installed apps: ${e.message}")
      }
    }

    AsyncFunction("setBlockedApps") { packageNames: List<String>, promise: Promise ->
      // Defensive: drop our own package so the user can't lock themselves
      // out of the very app they need to unlock from. The Service has
      // a similar guard, but enforcing it here keeps the prefs sane.
      val ourPackage = appContext.reactContext?.packageName
      val cleaned = packageNames.filter { it != ourPackage }.toSet()
      sharedPrefs().edit()
        .putStringSet(KEY_BLOCKED_PACKAGES, cleaned)
        .apply()
      promise.resolve(null)
    }

    AsyncFunction("getBlockedApps") { promise: Promise ->
      val set = sharedPrefs().getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()
      promise.resolve(set.toList())
    }
  }

  // MARK: - Helpers

  /**
   * Returns the current FocusShield authorization status.
   *
   * Reads the system setting for enabled accessibility services and
   * checks whether our service is in the list. This is the canonical
   * way to check on Android (no callback exists for "user enabled me").
   */
  private fun checkAuthStatus(): String {
    val ctx = appContext.reactContext ?: return "denied"
    val am = ctx.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
      ?: return "denied"
    val enabled = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC)
    val ourName = "${ctx.packageName}/${FocusShieldService::class.java.name}"
    val approved = enabled.any { it.resolveInfo?.serviceInfo?.name == FocusShieldService::class.java.name
        || "${it.resolveInfo?.serviceInfo?.packageName}/${it.resolveInfo?.serviceInfo?.name}" == ourName }
    return if (approved) "approved" else "denied"
  }

  /**
   * Lists installed user apps (excludes system apps and our own app).
   * Returns a list of `{packageName, label}` objects for the JS picker UI.
   */
  private fun queryInstalledApps(pm: PackageManager): List<Map<String, String>> {
    val ourPackage = appContext.reactContext?.packageName
    val packages = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      pm.getInstalledPackages(PackageManager.PackageInfoFlags.of(0L))
    } else {
      @Suppress("DEPRECATION")
      pm.getInstalledPackages(0)
    }
    return packages
      .asSequence()
      // 1) skip our own app — we never want to block ourselves
      .filter { it.packageName != ourPackage }
      // 2) skip pure system apps (still allow updated system apps since
      //    users may want to block the pre-installed Instagram, etc.)
      .filter { (it.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0
        || (it.applicationInfo.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0 }
      .map { pkg ->
        val label = pkg.applicationInfo.loadLabel(pm).toString()
        mapOf("packageName" to pkg.packageName, "label" to label)
      }
      .sortedBy { it["label"]?.lowercase() ?: it["packageName"] ?: "" }
      .toList()
  }

  private fun sharedPrefs() =
    appContext.reactContext!!.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  companion object {
    /**
     * SharedPreferences file name. The Service reads the same file
     * via getSharedPreferences(PREFS_NAME, ...), so changes here
     * are picked up on the next foreground-app event.
     */
    const val PREFS_NAME = "focus_shield_prefs"

    /** StringSet of package names the user has chosen to block. */
    const val KEY_BLOCKED_PACKAGES = "blocked_packages"

    /**
     * Long timestamp (epoch ms) until which the shield is lifted.
     * 0 means "no unlock active". The Service compares against
     * System.currentTimeMillis() on every event.
     */
    const val KEY_UNLOCKED_UNTIL = "unlocked_until"
  }
}
