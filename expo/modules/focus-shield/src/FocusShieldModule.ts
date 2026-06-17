import { NativeModule, requireNativeModule } from "expo";
import type {
  FocusShieldAuthStatus,
  FocusShieldEvents,
  InstalledApp,
} from "./FocusShield.types";

// `requireNativeModule` resolves the native implementation registered
// under Name("FocusShield") in ios/FocusShieldModule.swift and
// android/.../FocusShieldModule.kt. On web, the requireNativeModule
// call is intercepted and returns the no-op stub from
// FocusShieldModule.web.ts (handled by Expo's web platform resolution).
//
// Pattern:
//   - `NativeModule<FocusShieldEvents>` is generic over the EVENTS map.
//     We pass the (currently empty) event map.
//   - Function methods are declared directly on the class — they are
//     resolved at runtime by `requireNativeModule`, not statically
//     present on the base `NativeModule<>` type.
declare class FocusShieldModule extends NativeModule<FocusShieldEvents> {
  // Authorization
  getAuthorizationStatus(): Promise<FocusShieldAuthStatus>;
  requestAuthorization(): Promise<FocusShieldAuthStatus>;

  // Shield management (both platforms)
  clearShield(): Promise<void>;
  unlockForDuration(durationSeconds: number): Promise<void>;
  getRemainingUnlockSeconds(): Promise<number>;

  // iOS: native FamilyActivityPicker
  presentAppPicker(): Promise<void>;

  // Android: package-name-based blocking
  getInstalledSocialApps(): Promise<InstalledApp[]>;
  setBlockedApps(packageNames: string[]): Promise<void>;
  getBlockedApps(): Promise<string[]>;
}

export default requireNativeModule<FocusShieldModule>("FocusShield");
