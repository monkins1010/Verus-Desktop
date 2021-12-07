const { pushMessage } = require('../../../ipc/ipc');
const { ReservedPluginTypes } = require('../../utils/plugin/builtin');

module.exports = (api) => {
  api.loginConsentUi = {}

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
            resolve(data);
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