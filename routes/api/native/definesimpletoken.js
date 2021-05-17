const Promise = require('bluebird');

module.exports = (api) => {
  /**
   * defines a simple cutoken currency
   * @param {String} name The name of the token
   * @param {number} options chain launch params
   * @param {String[]} preallocations a list of ["id":amount,...] addresses to recive preallocations
   */

  api.native.launch_simple_token = (
    coin,
    name,
    simple_addresses,
    amount
  ) => {
    let idJson = {
        name,
        options: 96,
        preallocations: `[${simple_addresses}:${amount}]`
    }


    return new Promise((resolve, reject) => {
      let paramArray = [idJson]

      //we need minimum 201 VRSC / VRSCTEST in the ID name to launch a currency
   //   controlAddress = await api.native.callDaemon(
    //    coin,
   //     "sendcurrency",
    //    [ "*",
    //      [
   //           {address: name,
    //          amount: 201
    //          },
     //     ]
    //    ]
    //  );
      api.native
        .callDaemon(
          coin,
          "definecurrency",
          paramArray,
        )
        .then(idRegistryResult => {
          resolve({
            chainTicker: coin,
            name,
            options,
            preallocations,
            resulttxid: idRegistryResult
          })
        })
        .catch(err => {
          reject(err);
        });
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
