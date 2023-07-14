module.exports = (api) => {  
  api.native.getreservetransfers = async (chainTicker) => {
    try {
      const z_operations = await api.native.callDaemon(chainTicker, 'z_getoperationstatus', [])
      let transfers = []

      for (const z_operation of z_operations) {
        if (
          z_operation.method === "sendcurrency" &&
          (z_operation.params[0].convertto != null || z_operation.params[0].exportto != null)
        ) {
          let from = [];
          let to = [];
          let via = [];

          for (const param of z_operation.params) {
            const ownCurrency = await api.native.callDaemon(chainTicker, "getcurrency", [param.currency])
            
            from.push(ownCurrency);
            to.push(
              param.convertto != null
                ? await api.native.callDaemon(chainTicker, "getcurrency", [param.convertto])
                : ownCurrency
            );
            via.push(
              param.via
                ? await api.native.callDaemon(chainTicker, "getcurrency", [param.via])
                : null
            );
          }

          let tx = null;

          try {
            if (z_operation.result.txid) {
              tx = await api.native.callDaemon(chainTicker, "getrawtransaction", [
                z_operation.result.txid,
                1,
              ]);
            }
          } catch (e) {}

          transfers.push({
            from,
            to,
            via,
            tx,
            operation: z_operation,
          });
        }
      }

      return transfers
    } catch(e) {
      throw e
    }
  }

  api.setPost('/native/get_reserve_transfers', async (req, res, next) => {
    const {
      chainTicker
    } = req.body;

    try {
      res.send(JSON.stringify({
        msg: "success",
        result: await api.native.getreservetransfers(chainTicker)
      }));
    } catch (e) {
      res.send(JSON.stringify({
        msg: "error",
        result: e.message
      }));
    }
  });
    
  return api;
};