const Promise = require('bluebird');
const { watchFile } = require('original-fs');

module.exports = (api) => {
  /**
   * defines a simple crowdfund project backed by verus only
   * @param {String} name The name of the token
   * @param {number} options chain launch params
   * @param {String[]} preallocations a list of ["id":amount,...] addresses to recive preallocations
   */


  api.native.create_advanced_currency = (
    coin,
    name,
    options,
    extra
  ) => {

    
   
    

    return new Promise(async (resolve, reject) => {

      Object.keys(extra).forEach(txDataKey => {
        if (extra[txDataKey] == null) delete extra[txDataKey]
      })

      let idJson = {name, options:options}

      
      Object.keys(extra).forEach(txDataKey => {
        idJson[txDataKey] = extra[txDataKey]
      })
      
      let paramArray = [idJson]

      api.log(paramArray, "native.debug");

      let definecurrencyreply = await api.native
        .callDaemon(
          coin,
          "definecurrency",
          paramArray,
        ).catch(err => {
          reject(err);
        });

      if(definecurrencyreply.hex){

        let rawtransaction = [definecurrencyreply.hex]

        api.native.callDaemon(coin, "sendrawtransaction",rawtransaction,)
        .then(async (sendtransactiontResult) => {
          api.log(`sendtransactiontResult.length=` + sendtransactiontResult.length, "native.debug");
          if(sendtransactiontResult.length === 64){

            let localCommitments = await api.loadLocalCommitments()
            api.log(`name=` + name, "native.debug");
            const existingIndex = localCommitments[coin].findIndex((value) => value.namereservation.name === name.slice(0, -1))
            api.log(`tokenState` + localCommitments[coin][existingIndex].extra.tokenState, "native.debug");
            localCommitments[coin][existingIndex].extra.tokenState = 1
            
  
            await api.saveLocalCommitments(localCommitments);
  
            resolve({Status: "Advanced Currrency Created", coin, Currency: name});

          }
        })
        .catch(err => {
          reject(err);
        })
        
      }


    });
  };

  //TODO: Add more checks in here as well
  api.native.create_advanced_currency_preflight = (
    coin,
    name,
    options,
    extra
  ) => {
    return new Promise((resolve, reject) => {
      resolve({
        chainTicker: coin,
        name,
        options,
        extra
      })
    });
  };

  api.setPost('/native/create_advanced_currency', (req, res, next) => {
    const {
      chainTicker,
      name,
      options,
      extra
    } = req.body;

    api.native
      .create_advanced_currency(
        chainTicker,
        name,
        options,
        extra
      )
      .then(idObj => {
        const retObj = {
          msg: "success",
          result: idObj
        };

        res.send(JSON.stringify(retObj));
      })
      .catch(error => {
        const retObj = {
          msg: "error",
          result: error.message
        };

        res.send(JSON.stringify(retObj));
      });
  });

  api.setPost('/native/create_advanced_currency_preflight', (req, res, next) => {
    const {
      chainTicker,
      name,
      options,
      extra
    } = req.body;

    api.native
      .launch_simple_crowdfund_preflight(
        chainTicker,
        name,
        options,
        extra
      )
      .then(AdvancedResult => {
        const retObj = {
          msg: "success",
          result: AdvancedResult
        };

        res.send(JSON.stringify(retObj));
      })
      .catch(error => {
        const retObj = {
          msg: "error",
          result: error.message
        };

        res.send(JSON.stringify(retObj));
      });
  });

  return api;
};
