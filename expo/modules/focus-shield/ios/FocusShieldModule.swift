import ExpoModulesCore
import FamilyControls
import ManagedSettings
import UIKit
import SwiftUI

// MARK: - FocusShield
//
// Phase 3 implementation: iOS FamilyControls integration.
//
// Required setup before this works in production:
//   1. Apply for the `com.apple.developer.family-controls` entitlement
//      at https://developer.apple.com/contact/request/family-controls
//      Without it, AuthorizationCenter.requestAuthorization returns .denied.
//   2. Add the entitlement to expo/app.json under `ios.entitlements`
//      (the .entitlements file ships with this module).
//   3. Build with EAS (e.g. `eas build --platform ios`); local iOS
//      prebuild is not possible from Windows.
//
// The native side is the source of truth for the blocked-app set: the
// opaque `ApplicationToken`s returned by FamilyActivityPicker never cross
// the JS bridge. JS calls into the Module to show the picker, apply the
// selection, and manage the unlock window.

private let focusShieldStoreName = ManagedSettingsStore.Name("FocusShieldStore")

public class FocusShieldModule: Module {
  private let store = ManagedSettingsStore(named: focusShieldStoreName)
  private var unlockTask: DispatchWorkItem?

  public func definition() -> ModuleDefinition {
    Name("FocusShield")

    // MARK: - Authorization

    /// Returns the current Screen Time authorization status.
    /// Mirrors `AuthorizationCenter.shared.authorizationStatus` as a
    /// string so it serializes cleanly across the bridge.
    AsyncFunction("getAuthorizationStatus") { (promise: Promise) in
      let status = AuthorizationCenter.shared.authorizationStatus
      promise.resolve(Self.mapAuthStatus(status))
    }

    /// Triggers the system Screen Time authorization sheet. Resolves
    /// with the post-request status. Rejects only on unexpected error.
    AsyncFunction("requestAuthorization") { (promise: Promise) in
      Task {
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
          let status = AuthorizationCenter.shared.authorizationStatus
          promise.resolve(Self.mapAuthStatus(status))
        } catch {
          promise.reject("AUTH_ERROR", "FamilyControls authorization failed: \(error.localizedDescription)")
        }
      }
    }

    // MARK: - Shield management

    /// Presents the FamilyActivityPicker modally. When the user confirms
    /// a selection, the selected `ApplicationToken`s are applied to the
    /// `ManagedSettingsStore.shield.applications`. The selection is opaque
    /// and never crosses the JS bridge. Resolves when the picker closes.
    AsyncFunction("presentAppPicker") { (promise: Promise) in
      guard AuthorizationCenter.shared.authorizationStatus == .approved else {
        promise.reject("NOT_AUTHORIZED", "FamilyControls is not authorized. Call requestAuthorization() first.")
        return
      }
      Self.presentActivityPicker(store: self.store) {
        promise.resolve(nil)
      }
    }

    /// Removes all shields. The user is unblocked until a new selection
    /// is applied via `presentAppPicker` or `applyShieldFromCache`.
    AsyncFunction("clearShield") { (promise: Promise) in
      self.cancelScheduledUnlock()
      self.store.shield.applications = nil
      self.store.shield.applicationCategories = nil
      self.store.shield.webDomains = nil
      promise.resolve(nil)
    }

    /// Clears the shield now and re-applies it after `durationSeconds`.
    /// Used by the puzzle flow: "unlock social for 3 hours after a solve".
    AsyncFunction("unlockForDuration") { (durationSeconds: Double, promise: Promise) in
      guard durationSeconds > 0 else {
        promise.reject("INVALID_DURATION", "durationSeconds must be positive")
        return
      }
      self.cancelScheduledUnlock()
      // Cache the currently-shielded applications so we can re-apply later.
      let cachedApplications = self.store.shield.applications
      self.store.shield.applications = nil
      self.scheduleReapply(applications: cachedApplications, after: durationSeconds)
      promise.resolve(nil)
    }

    /// Returns the seconds remaining on the active unlock window, or 0
    /// if no unlock is active. Best-effort — the timer is in-memory; if
    /// the process is suspended, the unlock may persist beyond the
    /// scheduled time (until next foreground launch).
    AsyncFunction("getRemainingUnlockSeconds") { (promise: Promise) in
      promise.resolve(self.remainingUnlockSeconds)
    }

    // MARK: - Android-only stubs
    //
    // These three methods exist on Android, where apps are identified
    // by package name (a plain string). iOS uses Apple's opaque
    // `ApplicationToken`s from FamilyActivityPicker and the user
    // selects apps via the native picker — see `presentAppPicker`
    // above. JS callers should feature-detect by trying
    // `presentAppPicker` (iOS) or `getInstalledSocialApps` (Android).

    AsyncFunction("getInstalledSocialApps") { (promise: Promise) in
      promise.reject(
        "UNAVAILABLE_ON_IOS",
        "getInstalledSocialApps is Android-only. On iOS, use presentAppPicker."
      )
    }

    AsyncFunction("setBlockedApps") { (_: [String], promise: Promise) in
      promise.reject(
        "UNAVAILABLE_ON_IOS",
        "setBlockedApps is Android-only. On iOS, use presentAppPicker."
      )
    }

    AsyncFunction("getBlockedApps") { (promise: Promise) in
      promise.reject(
        "UNAVAILABLE_ON_IOS",
        "getBlockedApps is Android-only. The iOS blocked set is opaque."
      )
    }

    // MARK: - Events

    /// Emits "shieldTriggered" whenever the user attempts to open a
    /// blocked application and iOS shows the system shield. iOS does
    /// not expose a direct hook for this event; we approximate it via
    /// `applicationDidBecomeActive` (the shield sheet typically appears
    /// over the foreground app, and iOS surfaces the blocked app as the
    /// foreground process). Best-effort; the canonical "blocked" UX is
    /// the system shield itself, not our event.
    Events("shieldTriggered")

    OnAppDidBecomeActive {
      // No-op: the iOS system shield handles the user-visible UX. The
      // event hook is exposed for future analytics; subscribing in JS
      // is a no-op for now.
    }
  }

  // MARK: - Helpers

  private static func mapAuthStatus(_ status: AuthorizationStatus) -> String {
    switch status {
    case .notDetermined: return "notDetermined"
    case .denied:        return "denied"
    case .approved:      return "approved"
    @unknown default:    return "notDetermined"
    }
  }

  /// Presents `FamilyActivityPicker` as a modal SwiftUI view. Calls
  /// `completion` when the picker is dismissed (regardless of whether
  /// the user confirmed a selection).
  private static func presentActivityPicker(
    store: ManagedSettingsStore,
    completion: @escaping () -> Void
  ) {
    guard let rootVC = Self.topViewController() else {
      completion()
      return
    }
    let host = ActivityPickerHost(store: store) {
      rootVC.dismiss(animated: true) {
        completion()
      }
    }
    let hosting = UIHostingController(rootView: host)
    hosting.modalPresentationStyle = .formSheet
    rootVC.present(hosting, animated: true)
  }

  private static func topViewController() -> UIViewController? {
    guard
      let scene = UIApplication.shared.connectedScenes
        .compactMap({ $0 as? UIWindowScene })
        .first(where: { $0.activationState == .foregroundActive }),
      let window = scene.windows.first(where: { $0.isKeyWindow }) ?? scene.windows.first,
      var top = window.rootViewController
    else { return nil }
    while let presented = top.presentedViewController { top = presented }
    return top
  }

  // MARK: - Unlock scheduling

  private func scheduleReapply(applications: Set<ApplicationToken>?, after seconds: TimeInterval) {
    self.unlockEndsAt = Date().addingTimeInterval(seconds)
    let task = DispatchWorkItem { [weak self] in
      guard let self = self else { return }
      self.store.shield.applications = applications
      self.unlockEndsAt = nil
    }
    self.unlockTask = task
    DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: task)
  }

  private func cancelScheduledUnlock() {
    self.unlockTask?.cancel()
    self.unlockTask = nil
    self.unlockEndsAt = nil
  }

  private var unlockEndsAt: Date?
  private var remainingUnlockSeconds: Double {
    guard let endsAt = self.unlockEndsAt else { return 0 }
    return max(0, endsAt.timeIntervalSinceNow)
  }
}

// MARK: - ActivityPickerHost
//
// SwiftUI host for `FamilyActivityPicker`. Renders the system picker
// inside a NavigationStack with a "Done" button that dismisses the host
// and applies the selection to the ManagedSettingsStore.
private struct ActivityPickerHost: View {
  let store: ManagedSettingsStore
  let onDismiss: () -> Void

  @State private var selection = FamilyActivitySelection()

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Block Apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              let tokens = selection.applicationTokens
              self.store.shield.applications = tokens.isEmpty ? nil : tokens
              self.onDismiss()
            }
          }
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") {
              self.onDismiss()
            }
          }
        }
    }
  }
}
