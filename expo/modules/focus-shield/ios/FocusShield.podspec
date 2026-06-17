Pod::Spec.new do |s|
  s.name           = 'FocusShield'
  s.version        = '1.0.0'
  s.summary        = 'iOS FamilyControls wrapper for ChessQuest Focus Shield'
  s.description    = 'Exposes Apple FamilyControls / ManagedSettings APIs to the React Native layer so ChessQuest can block selected apps and lift the shield after the user solves a chess puzzle.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # System frameworks required by FamilyControls.
  # `FamilyControls` provides AuthorizationCenter, FamilyActivityPicker,
  # FamilyActivitySelection, ApplicationToken, etc.
  # `ManagedSettings` provides ManagedSettingsStore and the shield APIs.
  s.frameworks = 'FamilyControls', 'ManagedSettings'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
