import { NativeModule, requireNativeModule } from "expo";
import type {
  FocusShieldAuthStatus,
  FocusShieldEvents,
} from "./FocusShield.types";

// `requireNativeModule` resolves the native implementation registered
// under Name("FocusShield") in ios/FocusShieldModule.swift. On web, the
// requireNativeModule call is intercepted and returns the no-op stub
// from FocusShieldModule.web.ts (handled by Expo's web platform
// resolution).
//
// Pattern:
//   - `NativeModule<FocusShieldEvents>` is generic over the EVENTS map.
//     We pass the (currently empty) event map.
//   - Function methods are declared directly on the class — they are
//     resolved at runtime by `requireNativeModule`, not statically
//     present on the base `NativeModule<>` type, so `implements` is
//     not used here.
declare class FocusShieldModule extends NativeModule<FocusShieldEvents> {
  getAuthorizationStatus(): Promise<FocusShieldAuthStatus>;
  requestAuthorization(): Promise<FocusShieldAuthStatus>;
  presentAppPicker(): Promise<void>;
  clearShield(): Promise<void>;
  unlockForDuration(durationSeconds: number): Promise<void>;
  getRemainingUnlockSeconds(): Promise<number>;
}

export default requireNativeModule<FocusShieldModule>("FocusShield");
