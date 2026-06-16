// Public TypeScript surface for the focus-shield Expo Module.
// Mirrors the iOS FamilyControls / ManagedSettings API exposed by
// ios/FocusShieldModule.swift. On Android and web, the module is a
// no-op stub (see FocusShieldModule.web.ts and the Android stub in
// android/src/main/java/expo/modules/focusshield/FocusShieldModule.kt).

/**
 * Mirrors `AuthorizationStatus` from Apple's FamilyControls framework.
 *  - `notDetermined`: user has not yet been asked. Call `requestAuthorization`.
 *  - `denied`:        user (or the OS, due to missing entitlement) denied access.
 *  - `approved`:      FamilyControls is fully available.
 */
export type FocusShieldAuthStatus = "notDetermined" | "denied" | "approved";

/**
 * Events emitted by the native side. The map is currently empty —
 * the iOS system shield is the canonical "blocked" UX, so we do
 * not need a JS-side event for now. The map is reserved for future
 * use (e.g. analytics on shield appearances).
 */
export type FocusShieldEvents = Record<string, never>;

/**
 * Strongly-typed subset of the native Module's function surface.
 * Used by `FocusShieldModule.ts` as a structural type check via
 * `implements` on the class declaration.
 */
export interface FocusShieldNativeModule {
  /** Returns the current Screen Time authorization status. */
  getAuthorizationStatus(): Promise<FocusShieldAuthStatus>;

  /**
   * Triggers the system Screen Time authorization sheet. Resolves
   * with the post-request status. Rejects on unexpected error.
   *
   * NOTE: requires the `com.apple.developer.family-controls`
   * entitlement to be granted by Apple; otherwise this resolves
   * with `"denied"`.
   */
  requestAuthorization(): Promise<FocusShieldAuthStatus>;

  /**
   * Presents the iOS FamilyActivityPicker modally. The user picks
   * which apps to block; on confirm, the selection is applied to
   * the ManagedSettingsStore. Resolves when the picker is dismissed.
   * The selected app set is opaque (Apple's `ApplicationToken`s)
   * and never crosses the JS bridge.
   *
   * Rejects with code `NOT_AUTHORIZED` if FamilyControls is not
   * currently `.approved`.
   */
  presentAppPicker(): Promise<void>;

  /**
   * Removes all shields. The user is unblocked until the next call
   * to `presentAppPicker`. The unlock timer (if any) is cancelled.
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
   * if no unlock is currently active. Best-effort: the timer is
   * in-memory; if the process is suspended, the unlock may persist
   * beyond the scheduled time until the next foreground launch.
   */
  getRemainingUnlockSeconds(): Promise<number>;
}
