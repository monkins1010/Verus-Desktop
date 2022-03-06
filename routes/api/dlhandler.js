const { LOGIN_CONSENT_REQUEST_VDXF_KEY } = require('verus-typescript-primitives');
const base64url = require("base64url");

module.exports = (api) => {
  api.dlhandler = (url) => {
    const handlers = {
      [LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid]: (url) => {
        const value = url.searchParams.get(LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid)
        
        return api.loginConsentUi.request(
          JSON.parse(base64url.decode(value)),
          {
            id: "VERUS_DESKTOP_MAIN",
            search_builtin: true
          }
        )
      }
    }

    return handlers[url.pathname.replace(/\//g, "")](url)
  }

  return api;
};