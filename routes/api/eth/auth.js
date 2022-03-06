module.exports = (api) => {  
  api.setPost('/eth/auth', (req, res, next) => {
    let seed = req.body.seed;

    if (!api.seed) {
      api.seed = seed;
    }

    api.eth.wallet = api.eth._keys(seed, true);

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.send(JSON.stringify(retObj));
  }, true);

  api.setGet('/eth/check_auth', (req, res, next) => {
    res.send(JSON.stringify({
      msg: 'success',
      result: api.eth.wallet != null && api.eth.wallet.signer != null && api.eth.wallet.signer.signingKey != null,
    }));
  });

  api.setPost('/eth/logout', (req, res, next) => {
    api.eth.wallet = null
    api.eth.interface = null

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.send(JSON.stringify(retObj));
  });

  return api; 
};
