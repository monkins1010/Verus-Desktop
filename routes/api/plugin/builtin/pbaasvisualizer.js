const { pushMessage } = require('../../../ipc/ipc');
const { ReservedPluginTypes } = require('../../utils/plugin/builtin');

module.exports = (api) => {
  api.pbaasVisualizer = {}

  api.pbaasVisualizer.visualize = async (
    request,
    originInfo
  ) => {
    return new Promise((resolve, reject) => {
      try {
        api.startPlugin(
          ReservedPluginTypes.VERUS_PBAAS_VISUALIZER,
          true,
          () => {},
          (pluginWindow) => {
            pushMessage(
              pluginWindow,
              {
                request: request,
                origin_app_info: originInfo,
              },
              "VERUS_PBAAS_VISUALIZER_REQUEST"
            );
          },
          1280,
          850
        );

        // No need to wait for any data to be returned, visualization is static
        resolve()
      } catch (e) {
        reject(e);
      }
    });
  };

  api.setPost('/plugin/builtin/verus_pbaas_visualizer/visualize', async (req, res, next) => {
    const { request } = req.body;
    const { app_id, builtin } = req.api_header
   
    try {
      const retObj = {
        msg: "success",
        result: await api.pbaasVisualizer.visualize(
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