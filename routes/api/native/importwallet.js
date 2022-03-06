module.exports = (api) => {  
  api.native.importwallet = async (chain, filename) => {
    return await api.native.callDaemon(chain, "z_importwallet", [filename]);
  }

  api.setPost('/native/importwallet', async (req, res, next) => {
    const { chain, filename } = req.body;

    try {
      res.send(
        JSON.stringify({
          msg: "success",
          result: await api.native.importwallet(chain, filename),
        })
      );
    } catch (e) {
      res.send(JSON.stringify({
        msg: "error",
        result: e.message
      }));
    }
  });
    
  return api;
};