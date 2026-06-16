import { registerWebModule, NativeModule } from 'expo';

class FocusShieldModule extends NativeModule<{}> {}

export default registerWebModule(FocusShieldModule, 'FocusShieldModule');
