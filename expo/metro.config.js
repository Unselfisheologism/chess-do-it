const { getDefaultConfig } = require("expo/metro-config");

// Bypass @rork-ai/toolkit-sdk/metro wrapper — it was forcing
// node_modules/expo/AppEntry.js (which imports legacy ../../App)
// instead of the package.json "main": "expo-router/entry" entry.
// The default Expo metro config respects the main field.
module.exports = getDefaultConfig(__dirname);
