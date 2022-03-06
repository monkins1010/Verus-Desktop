module.exports = (api) => {  
  api.native.exportwallet = async (chain, filename, omitemptyaddresses) => {
    return await api.native.callDaemon(chain, "z_exportwallet", [filename, omitemptyaddresses]);
  }

  api.setPost('/native/exportwallet', async (req, res, next) => {
    const { chain, filename, omitemptyaddresses } = req.body;

    try {
      res.send(
        JSON.stringify({
          msg: "success",
          result: await api.native.exportwallet(chain, filename, omitemptyaddresses),
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