package expo.modules.focusshield

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.view.accessibility.AccessibilityEvent

// MARK: - FocusShieldService
//
// The Android-side enforcement of the focus shield. Runs as a
// system-managed AccessibilityService — it outlives the Expo process
// and can observe the foreground app via accessibility events.
//
// Architecture:
//   1. The OS dispatches TYPE_WINDOW_STATE_CHANGED events as the user
//      switches between apps. We receive one for the new top activity.
//   2. We compare the foreground package against the blocked set
//      stored in SharedPreferences by FocusShieldModule.
//   3. If blocked AND the unlock timer has expired, we launch our
//      app's "gate" route via deep link, which shows a chess puzzle
//      the user must solve to unlock.
//   4. On solve, FocusShieldModule.markPuzzleSolved() updates the
//      unlock timestamp in SharedPreferences, and we stop interfering
//      until the timestamp passes.
//
// Permissions / setup (cannot be done in code):
//   - The BIND_ACCESSIBILITY_SERVICE permission is signature-level and
//     does not require runtime grant.
//   - The user MUST manually enable this service in the system
//     Settings → Accessibility screen. JS calls
//     FocusShield.openAccessibilitySettings() to deep-link there.
//   - Once enabled, the service runs continuously until the user
//     disables it (or the app is uninstalled).
//
// Why not the simpler "draw an overlay" approach?
//   Android's `SYSTEM_ALERT_WINDOW` permission requires a "draw over
//   other apps" runtime grant (and Play Store review hostility).
//   Launching our own gate activity via deep link achieves the same
//   effect (the user is bounced out of Instagram into our app) with
//   fewer permissions and a cleaner UX. This is the pattern used by
//   ScreenZen, Stay Off, and most other self-control apps.
class FocusShieldService : AccessibilityService() {

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
    Log.d(TAG, "FocusShieldService connected")
  }

  override fun onUnbind(intent: Intent?): Boolean {
    Log.d(TAG, "FocusShieldService unbound")
    instance = null
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }

  override fun onInterrupt() {
    // Required by AccessibilityService. No-op: we don't hold any
    // long-lived state here; the work happens in onAccessibilityEvent.
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

    val foregroundPackage = event.packageName?.toString() ?: return
    if (foregroundPackage.isBlank()) return

    val ourPackage = applicationContext.packageName
    // If the user is in our own app, no enforcement needed.
    if (foregroundPackage == ourPackage) return

    val prefs = getSharedPreferences(
      FocusShieldModule.PREFS_NAME,
      Context.MODE_PRIVATE
    )

    // Check the unlock window first — if the user has solved a puzzle
    // recently, we don't interfere until the timestamp passes.
    val unlockedUntil = prefs.getLong(FocusShieldModule.KEY_UNLOCKED_UNTIL, 0L)
    if (unlockedUntil > 0L && System.currentTimeMillis() < unlockedUntil) {
      Log.d(TAG, "Shield lifted until $unlockedUntil — allowing $foregroundPackage")
      return
    }

    val blocked = prefs.getStringSet(
      FocusShieldModule.KEY_BLOCKED_PACKAGES,
      emptySet()
    ) ?: emptySet()
    if (blocked.isEmpty()) return
    if (foregroundPackage !in blocked) return

    Log.d(TAG, "Blocked app detected: $foregroundPackage — launching gate")

    // Bounce the user into our app's gate route. The deep link is
    // handled by expo-router, which routes to app/gate.tsx with
    // `?package=...` as a query param. CLEAR_TOP ensures we don't
    // accumulate back-stack entries if the gate is already open.
    val gateUri = Uri.parse(
      "rork-app://gate?package=${Uri.encode(foregroundPackage)}"
    )
    val intent = Intent(Intent.ACTION_VIEW, gateUri).apply {
      setPackage(ourPackage)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    try {
      startActivity(intent)
    } catch (e: Exception) {
      // If the deep link fails (e.g. main activity not exported),
      // log and fall through. The shield enforcement is best-effort.
      Log.e(TAG, "Failed to launch gate for $foregroundPackage: ${e.message}")
    }
  }

  companion object {
    private const val TAG = "FocusShieldService"

    /**
     * Live reference to the connected service instance, or null if
     * the service is not running. The Expo Module reads this from
     * `isServiceRunning()`. Use @Volatile because the service is
     * bound/unbound by the system on a different thread than JS calls.
     */
    @Volatile
    var instance: FocusShieldService? = null
      private set
  }
}
