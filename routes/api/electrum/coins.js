const { getRandomIntInclusive } = require('agama-wallet-lib/src/utils');
const fs = require('fs-extra');

module.exports = (api) => {
  api.findCoinName = (network) => {
    for (let key in api.electrumServers) {
      if (key.toLowerCase() === network.toLowerCase()) {
        return key;
      }
    }
  }

  api.addElectrumCoin = async(coin, customServers = [], tags = [], txFee) => {
    coin = coin.toLowerCase();
    
    if (customServers.length > 0 && txFee != null && !isNaN(txFee) && api.electrumServers[coin] == null) {
      api.electrumServers[coin] = {
        serverList: customServers,
        txfee: txFee
      }
    }

    if (tags.includes('is_komodo')) api.customKomodoNetworks[coin] = true

    // select random server
    let randomServer;
    let servers = api.electrumServers[coin] ? api.electrumServers[coin].serverList : []
    
    // pick a random server to communicate with
    if (servers &&
        servers.length > 0) {
      const _randomServerId = getRandomIntInclusive(0, servers.length - 1);
      const _randomServer = servers[_randomServerId];
      const _serverDetails = _randomServer.split(':');

      if (_serverDetails.length === 3) {
        randomServer = {
          ip: _serverDetails[0],
          port: _serverDetails[1],
          proto: _serverDetails[2],
        };
      }
    }
    
    api.electrum.coinData[coin] = {
      name: coin,
      server: {
        ip: randomServer.ip,
        port: randomServer.port,
        proto: randomServer.proto,
      },
      serverList: servers ? servers : 'none',
      txfee: coin === 'btc' ? 'calculated' : api.electrumServers[coin] ? api.electrumServers[coin].txfee : 0,
    };

    // wait for spv connection to be established
    await api.ecl(coin);

    if (Object.keys(api.electrumKeys).length > 0) {
      const _keys = api.wifToWif(
        api.electrumKeys[Object.keys(api.electrumKeys)[0]].priv,
        coin
      );

      api.electrumKeys[coin] = {
        priv: _keys.priv,
        pub: _keys.pub,
      };
    } else if (api.seed) {
      api.auth(api.seed, true);
    }

    return true;
  }

  api.setPost('/electrum/coins/activate', async(req, res, next) => {
    const { chainTicker, launchConfig } = req.body
    const { customServers, tags, txFee } = launchConfig

    const result = await api.addElectrumCoin(
      chainTicker,
      customServers || [],
      tags,
      txFee,
      false
    );

    const retObj = {
      msg: 'success',
      result,
    };

    res.send(JSON.stringify(retObj));
  });

  api.checkCoinConfigIntegrity = (coin) => {
    let _totalCoins = 0;

    for (let key in api.electrumJSNetworks) {
      if (!api.electrumServers[key] ||
          (api.electrumServers[key] && !api.electrumServers[key].serverList)) {
        delete api.electrumServers[key];
      } else {
        _totalCoins++;
      }
    }
  };

  return api;
};