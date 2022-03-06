const path = require('path')

const ReservedPluginTypes = {
  VERUS_DESKTOP_MAIN: "VERUS_DESKTOP_MAIN",
  VERUS_DESKTOP_AUTHENTICATOR: "VERUS_DESKTOP_AUTHENTICATOR",
  VERUS_LOGIN_CONSENT_UI: "VERUS_LOGIN_CONSENT_UI"
}

// Builtin plugins have access to all permissions by default
const BuiltinPlugins = {
  [ReservedPluginTypes.VERUS_DESKTOP_MAIN]: {
    name: "Verus Desktop",
    devPort: 3000
  },
  [ReservedPluginTypes.VERUS_DESKTOP_AUTHENTICATOR]: {
    name: "Authenticator",
    path: path.join(
      __dirname,
      "../",
      "../",
      "../",
      "../",
      "assets",
      "plugins",
      "builtin",
      "verus-desktop-authenticator"
    ),
    devPort: 3001
  },
  [ReservedPluginTypes.VERUS_LOGIN_CONSENT_UI]: {
    name: "VerusID Authentication",
    path: path.join(
      __dirname,
      "../",
      "../",
      "../",
      "../",
      "assets",
      "plugins",
      "builtin",
      "verus-login-consent-client"
    ),
    devPort: 3001
  }
};

module.exports = {
  BuiltinPlugins,
  ReservedPluginTypes
}