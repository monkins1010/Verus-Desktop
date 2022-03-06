module.exports = (api) => {  
  api.setPost('/erc20/auth', (req, res, next) => {
    let seed = req.body.seed;

    if (!api.seed) {
      api.seed = seed;
    }

    api.erc20.wallet = api.eth._keys(seed, true);

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.send(JSON.stringify(retObj));
  }, true);

  api.setGet('/erc20/check_auth', (req, res, next) => {
    res.send(JSON.stringify({
      msg: 'success',
      result: api.erc20.wallet != null && api.erc20.wallet.signer != null && api.erc20.wallet.signer.signingKey != null,
    }));
  });

  api.setPost('/erc20/logout', (req, res, next) => {
    api.erc20.wallet = null
    api.erc20.interface = null

    const retObj = {
      msg: 'success',
      result: 'success',
    };

    res.send(JSON.stringify(retObj));
  });

  return api; 
};
