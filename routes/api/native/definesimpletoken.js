const Promise = require('bluebird');
const { watchFile } = require('original-fs');

module.exports = (api) => {
  /**
   * defines a simple cutoken currency
   * @param {String} name The name of the token
   * @param {number} options chain launch params
   * @param {String[]} preallocations a list of ["id":amount,...] addresses to recive preallocations
   */

   function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }


  api.native.launch_simple_token = (
    coin,
    name,
    simple_address,
    amount
  ) => {

    let preallocation = {};
    preallocation[simple_address] = amount;
    let options = 96
    let preallocations = [preallocation]
    let idJson = {
        name,
        options,
        preallocations
    }


    return new Promise(async (resolve, reject) => {
      let paramArray = [idJson]

      //we need minimum 201 VRSC / VRSCTEST in the ID name to launch a currency
      // ["R*" '[{"address":"alice@quad", "amount":500.0},...]']
      

     
      let outputs = {address: idJson.name, amount:201}
      let sendcurrencyParams = ["R*",[ outputs ] ]
  
      await api.native.callDaemon(
        coin,
        "sendcurrency",
        sendcurrencyParams
  
      ).catch(err => {
        reject(err);
      });

      let bh =  await api.native.callDaemon(coin, "getblockcount", [] );
      
      let bh2 = bh
      while(bh === bh2)
      {
        bh =  await api.native.callDaemon(coin, "getblockcount", [] );
        
        sleep(3000);
        api.log(`waiting for sendcurrency`, "native.debug");

      }
      
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
            api.log(`tokenState` + localCommitments[coin][existingIndex].tokenState, "native.debug");
            localCommitments[coin][existingIndex].tokenState = 1
            
  
            await api.saveLocalCommitments(localCommitments);
  
            resolve({Status: "Token successfully launched, wait up to 20 minutes for it to appear in multiverse tab", coin, Token: name, Supply: amount});

          }
        })
        .catch(err => {
          reject(err);
        })
        
      }


    });
  };

  //TODO: Add more checks in here as well
  api.native.launch_simple_token_preflight = (
    coin,
    name,
    simple_addresses,
    amount
  ) => {
    return new Promise((resolve, reject) => {
      resolve({
        chainTicker: coin,
        name,
        simple_addresses,
        amount
      })
    });
  };

  api.setPost('/native/launch_simple_token', (req, res, next) => {
    const {
      chainTicker,
      name,
      simple_addresses,
      amount
    } = req.body;

    api.native
      .launch_simple_token(
        chainTicker,
        name,
        simple_addresses,
        amount
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

  api.setPost('/native/launch_simple_token_preflight', (req, res, next) => {
    const {
      chainTicker,
      name,
      simple_addresses,
      amount
    } = req.body;

    api.native
      .launch_simple_token_preflight(
        chainTicker,
        name,
        simple_addresses,
        amount
      )
      .then(idRegistryResult => {
        const retObj = {
          msg: "success",
          result: idRegistryResult
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
