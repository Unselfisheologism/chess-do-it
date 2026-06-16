import { NativeModule, requireNativeModule } from 'expo';

declare class FocusShieldModule extends NativeModule<{}> {}

export default requireNativeModule<FocusShieldModule>('FocusShield');
