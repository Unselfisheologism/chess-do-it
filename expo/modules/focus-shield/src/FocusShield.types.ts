// Public TypeScript surface for the focus-shield Expo Module.
// Mirrors the iOS FamilyControls / ManagedSettings API exposed by
// ios/FocusShieldModule.swift AND the Android AccessibilityService
// API exposed by android/.../FocusShieldModule.kt. On web, both
// surfaces are no-op stubs (see FocusShieldModule.web.ts).

/**
 * Mirrors `AuthorizationStatus` from Apple's FamilyControls framework
 * and the analogous state on Android (AccessibilityService enabled /
 * not enabled / not yet asked). The Android implementation never
 * returns "notDetermined" because we cannot programmatically enable
 * an AccessibilityService — the user has to visit Settings. JS code
 * should treat "notDetermined" and "denied" the same way (call
 * `requestAuthorization` to open the relevant Settings screen).
 */
export type FocusShieldAuthStatus = "notDetermined" | "denied" | "approved";

/**
 * An installed user app on Android. Returned by `getInstalledSocialApps`
 * to power the JS-side app picker UI. (iOS uses Apple's opaque
 * `ApplicationToken` via `presentAppPicker` instead.)
 */
export type InstalledApp = {
  packageName: string;
  label: string;
};

/**
 * Events emitted by the native side. The map is currently empty on
 * both platforms — the iOS system shield and the Android deep-link
 * gate are the canonical "blocked" UX, so we do not need JS-side
 * events for now. The map is reserved for future use (e.g. analytics
 * on shield appearances or authorization changes).
 */
export type FocusShieldEvents = Record<string, never>;

/**
 * Strongly-typed subset of the native Module's function surface.
 * Used by `FocusShieldModule.ts` for type checking.
 */
export interface FocusShieldNativeModule {
  // MARK: - Authorization (both platforms)

  /** Returns the current authorization status. */
  getAuthorizationStatus(): Promise<FocusShieldAuthStatus>;

  /**
   * Triggers the platform-specific authorization flow:
   *   - iOS: shows the system Screen Time sheet (resolves with
   *     the new status).
   *   - Android: opens Settings → Accessibility (the user has to
   *     enable the service manually; we cannot do it programmatically).
   *     Resolves with the current status; JS should poll
   *     `getAuthorizationStatus` after the user comes back.
   *
   * NOTE: iOS requires the `com.apple.developer.family-controls`
   * entitlement to be granted by Apple; otherwise this resolves
   * with `"denied"`.
   */
  requestAuthorization(): Promise<FocusShieldAuthStatus>;

  // MARK: - Shield management (both platforms)

  /**
   * Removes all shields / unblocks all apps. The user is unblocked
   * until the next call to `setBlockedApps` (Android) or
   * `presentAppPicker` (iOS). The unlock timer (if any) is cancelled.
   */
  clearShield(): Promise<void>;

  /**
   * Clears the shield for `durationSeconds` seconds, then re-applies
   * the previously-shielded app set. Used by the puzzle-solve flow:
   * "after you solve a lesson, social media unlocks for 3 hours".
   *
   * Rejects with `INVALID_DURATION` if `durationSeconds <= 0`.
   */
  unlockForDuration(durationSeconds: number): Promise<void>;

  /**
   * Returns the seconds remaining on the active unlock window, or 0
   * if no unlock is currently active. Best-effort: on iOS the timer
   * is in-memory; on Android the timestamp is persisted to
   * SharedPreferences, so the unlock survives process restarts.
   */
  getRemainingUnlockSeconds(): Promise<number>;

  // MARK: - iOS: native app picker

  /**
   * iOS only. Presents the iOS FamilyActivityPicker modally. The user
   * picks which apps to block; on confirm, the selection is applied
   * to the ManagedSettingsStore. Resolves when the picker is dismissed.
   * The selected app set is opaque (Apple's `ApplicationToken`s) and
   * never crosses the JS bridge.
   *
   * Rejects with `NOT_AUTHORIZED` if FamilyControls is not currently
   * `.approved`. Rejects with `UNAVAILABLE_ON_ANDROID` on Android.
   */
  presentAppPicker(): Promise<void>;

  // MARK: - Android: package-name-based blocking

  /**
   * Android only. Returns a list of installed user apps (system apps
   * are filtered out, as is our own package). Used by the JS-side
   * app picker UI to render checkboxes.
   *
   * Rejects with `UNAVAILABLE_ON_IOS` on iOS — use `presentAppPicker`
   * there.
   */
  getInstalledSocialApps(): Promise<InstalledApp[]>;

  /**
   * Android only. Writes the given package names as the blocked set
   * to SharedPreferences. The FocusShieldService reads this on every
   * `TYPE_WINDOW_STATE_CHANGED` event, so changes take effect on the
   * very next foreground app switch.
   *
   * Our own package is filtered out as a defensive measure (so the
   * user can't lock themselves out of the very app they need to
   * unlock from).
   *
   * Rejects with `UNAVAILABLE_ON_IOS` on iOS.
   */
  setBlockedApps(packageNames: string[]): Promise<void>;

  /**
   * Android only. Returns the current blocked-set as a list of
   * package names, for JS to hydrate the picker UI on mount.
   *
   * Rejects with `UNAVAILABLE_ON_IOS` on iOS.
   */
  getBlockedApps(): Promise<string[]>;
}
