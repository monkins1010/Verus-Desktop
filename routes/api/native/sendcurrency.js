module.exports = (api) => {  
  api.native.sendcurrency = async (chainTicker, from = "*", outputs = [], feeamount = null) => {
    try {
      return await api.native.callDaemon(
        chainTicker,
        "sendcurrency",
        feeamount === null ? [from, outputs] : [from, outputs, feeamount]
      );
    } catch(e) {
      throw e
    }
  }

  api.setPost('/native/sendcurrency', async (req, res, next) => {
    const { from, outputs, feeamount, chainTicker } = req.body;

    try {
      res.send(JSON.stringify({
        msg: "success",
        result: await api.native.sendcurrency(chainTicker, from, outputs.map(x => {
          Object.keys(x).map(y => {
            if (x[y] == null || x[y].length === 0) delete x[y]
          })

          return x
        }), feeamount)
      }));
    } catch (e) {
      res.send(
        JSON.stringify({
          msg: "error",
          result: e.message,
        })
      );
    }
  });
    
  return api;
};