const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.create_simple_token = (coin, name, referralId, primaryAddress, simple_addresses, amount) => {
    return new Promise(async (resolve, reject) => {      
      let params = referralId ? [name, null, referralId] : [name, null]
      let controlAddress

      try {
        if (primaryAddress == null)
          controlAddress = await api.native.callDaemon(
            coin,
            "getnewaddress",
            []
          );
        else controlAddress = primaryAddress;
        params[1] = controlAddress

        api.native.callDaemon(coin, 'registernamecommitment', params)
        .then(async (nameCommitmentResult) => {
          if (
            nameCommitmentResult &&
            nameCommitmentResult.txid &&
            nameCommitmentResult.namereservation
          ) {
            let localCommitments = await api.loadLocalCommitments()
            let saveCommitment = { ...nameCommitmentResult, controlAddress, simple_addresses, amount }
  
            if (localCommitments[coin]) {
              const existingIndex = localCommitments[coin].findIndex((value) => value.namereservation.name === name)
              
              if (existingIndex !== -1) {
                localCommitments[coin][existingIndex] = saveCommitment
              } else {
                localCommitments[coin] = [...localCommitments[coin], saveCommitment]
              }
            } else {
              localCommitments[coin] = [saveCommitment]
            }
  
            await api.saveLocalCommitments(localCommitments);
  
            resolve({...saveCommitment, coin});
          } else {
            throw new Error(nameCommitmentResult)
          }
        })
        .catch(err => {
          reject(err)
        })
      } catch(e) {
        reject(e)
      }
    });
  };

  api.native.create_simple_token_preflight = (coin, name, referralId, primaryAddress, simple_addresses, amount) => {
    return new Promise((resolve, reject) => {      
      resolve({ namereservation: { coin, name, referral: referralId, primaryAddress, simple_addresses, amount } });
    });
  };

  api.setPost('/native/create_simple_token', (req, res, next) => {
    const { chainTicker, name, referralId, primaryAddress, simple_addresses, amount } = req.body

    api.native.create_simple_token(chainTicker, name, referralId, primaryAddress, simple_addresses, amount)
    .then((nameCommitmentResult) => {
      const retObj = {
        msg: 'success',
        result: nameCommitmentResult,
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

  api.setPost('/native/create_simple_token_preflight', (req, res, next) => {
    const { chainTicker, name, referralId, primaryAddress, simple_addresses, amount } = req.body

    api.native.create_simple_token_preflight(chainTicker, name, referralId, primaryAddress, simple_addresses, amount)
    .then((preflightRes) => {
      const retObj = {
        msg: 'success',
        result: preflightRes,
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