const { standardizeMiningInfo } = require('../utils/standardization/standardization')

module.exports = (api) => {    
  api.native.get_mininginfo = (coin, includeBridgekeeper) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'getmininginfo', [])
      .then(async (mininginfo) => {
        try {
          // If mergemining with parent, set hashrate = parent hashrate
          if (mininginfo.mergemining != null && mininginfo.mergemining > 0) {
            const currentCurrency = await api.native.callDaemon(coin, 'getcurrency', [coin])

            if (currentCurrency.currencyid !== currentCurrency.parent) {
              const parentCurrency = await api.native.callDaemon(
                coin,
                "getcurrency",
                [currentCurrency.parent]
              );
              const parentMiningInfo = await api.native.callDaemon(
                parentCurrency.name,
                "getmininginfo",
                []
              );

              if (parentMiningInfo.localhashps > 0) {
                mininginfo.localhashps = parentMiningInfo.localhashps
              }
            } 
          }
        } catch(e) {
          api.log("Could not process mergemining hashrate")
          api.log(e, 'get_mininginfo')
        }
        let retval = standardizeMiningInfo(mininginfo)
        if (!includeBridgekeeper) {
          const bridgeKeeperStatus = await api.native.bridgekeeper_status()
          if (bridgeKeeperStatus) {
            retval.bridgekeeperstatus = bridgeKeeperStatus;
          }
        }
        resolve(retval)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.setPost('/native/get_mininginfo', (req, res, next) => {
    const coin = req.body.chainTicker;
    const includeBridgekeeper = req.body?.includeBridgekeeper;
    api.native.get_mininginfo(coin, includeBridgekeeper)
    .then((mininginfo) => {
      const retObj = {
        msg: 'success',
        result: mininginfo,
      };
  
      res.send(JSON.stringify(retObj));  
    })
    .catch(error => {
      const retObj = {
        msg: 'error',
        result: error.message,
      };
  
      res.send(JSON.stringify(retObj));  
    })
  });

  return api;
};