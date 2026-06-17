import { registerWebModule, NativeModule } from "expo";

// Web is a no-op platform: the focus-shield feature requires native
// AccessibilityService (Android) or FamilyControls (iOS). The Module
// exists in JS-land so cross-platform code can import it without
// branching on `Platform.OS`, but every method below is a stub that
// resolves with a sensible "feature unavailable" value.
//
// This file is automatically picked up by Expo's web platform
// resolution in place of FocusShieldModule.ts.

class FocusShieldModule extends NativeModule<{}> {
  getAuthorizationStatus(): Promise<string> {
    return Promise.resolve("denied");
  }
  requestAuthorization(): Promise<string> {
    return Promise.resolve("denied");
  }
  clearShield(): Promise<void> {
    return Promise.resolve();
  }
  unlockForDuration(_durationSeconds: number): Promise<void> {
    return Promise.resolve();
  }
  getRemainingUnlockSeconds(): Promise<number> {
    return Promise.resolve(0);
  }
  presentAppPicker(): Promise<void> {
    return Promise.resolve();
  }
  getInstalledSocialApps(): Promise<never[]> {
    return Promise.resolve([]);
  }
  setBlockedApps(_packageNames: string[]): Promise<void> {
    return Promise.resolve();
  }
  getBlockedApps(): Promise<string[]> {
    return Promise.resolve([]);
  }
}

export default registerWebModule(FocusShieldModule, "FocusShieldModule");
