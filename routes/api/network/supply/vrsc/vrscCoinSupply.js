const { checkTimestamp } = require('agama-wallet-lib/src/time');
const { requestJson } = require('../../../utils/request/request');

let coinSupply = {
  result: null,
  lastUpdated: null,
};

const COIN_SUPPLY_MIN_ELAPSED_TIME = 60;

module.exports = (api) => {
  api.coinSupply['VRSC'] = () => {
    return new Promise(async (resolve, reject) => {
      if (checkTimestamp(coinSupply.lastUpdated) > COIN_SUPPLY_MIN_ELAPSED_TIME) {
        try {
          const res = await requestJson(
            "GET",
            'https://explorer.verus.io/api/coinsupply'
          );

          resolve(res);
        } catch(e) {
          reject(e)
        }
      } else {
        api.log('vrsc coinsupply, use cache', 'network.coinSupply');

        resolve(coinSupply.result)
      }
    });
  }

  return api;
};
