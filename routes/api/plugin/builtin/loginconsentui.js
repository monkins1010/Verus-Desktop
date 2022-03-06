const axios = require('axios');
const {
  LOGIN_CONSENT_RESPONSE_VDXF_KEY,
  LOGIN_CONSENT_WEBHOOK_VDXF_KEY,
  LOGIN_CONSENT_REDIRECT_VDXF_KEY,
} = require("verus-typescript-primitives");
const { pushMessage } = require('../../../ipc/ipc');
const { ReservedPluginTypes } = require('../../utils/plugin/builtin');
const { shell } = require('electron')
const { URL } = require('url');
const base64url = require('base64url');

module.exports = (api) => {
  api.loginConsentUi = {}

  api.loginConsentUi.handle_redirect = (response, redirectinfo) => {
    const { type, uri } = redirectinfo
    
    const handlers = {
      [LOGIN_CONSENT_WEBHOOK_VDXF_KEY.vdxfid]: async () => {
        return await axios.post(
          uri,
          response
        );
      },
      [LOGIN_CONSENT_REDIRECT_VDXF_KEY.vdxfid]: () => {
        const url = new URL(uri)
        url.searchParams.set(
          LOGIN_CONSENT_RESPONSE_VDXF_KEY.vdxfid,
          base64url(JSON.stringify(response))
        );
        
        shell.openExternal(url.toString())
        return null
      }
    }

    return handlers[type] == null ? null : handlers[type]();
  }

  api.loginConsentUi.request = async (
    request,
    originInfo
  ) => {
    return new Promise((resolve, reject) => {
      try {
        api.startPlugin(
          ReservedPluginTypes.VERUS_LOGIN_CONSENT_UI,
          true,
          (data) => {
            try {
              if (data.redirect) api.loginConsentUi.handle_redirect(data.response, data.redirect);

              resolve(data.response);
            } catch(e) {
              reject(e)
            }
          },
          (pluginWindow) => {
            pushMessage(
              pluginWindow,
              {
                request: request,
                origin_app_info: originInfo,
              },
              "VERUS_LOGIN_CONSENT_REQUEST"
            );
          },
          830,
          550
        );
      } catch (e) {
        reject(e);
      }
    });
  };

  api.setPost('/plugin/builtin/verus_login_consent_ui/request', async (req, res, next) => {
    const { request } = req.body;
    const { app_id, builtin } = req.api_header
   
    try {
      const retObj = {
        msg: "success",
        result: await api.loginConsentUi.request(
          request,
          {
            id: app_id,
            search_builtin: builtin,
          }
        ),
      };

      res.send(JSON.stringify(retObj));
    } catch (e) {
      const retObj = {
        msg: 'error',
        result: e.message,
      };

      res.send(JSON.stringify(retObj));
    }
  });

  return api;
};