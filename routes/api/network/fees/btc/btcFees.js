const { checkTimestamp } = require('agama-wallet-lib/src/time');
const { requestJson } = require('../../../utils/request/request');

let btcFees = {
  recommended: {},
  lastUpdated: null,
};

const BTC_FEES_MIN_ELAPSED_TIME = 120;

module.exports = (api) => {
  api.networkFees['BTC'] = () => {
    return new Promise(async (resolve, reject) => {
      if (checkTimestamp(btcFees.lastUpdated) > BTC_FEES_MIN_ELAPSED_TIME) {
        try {
          const res = await requestJson(
            "GET",
            "https://bitcoinfees.earn.com/api/v1/fees/recommended"
          );

          const { hourFee, halfHourFee, fastestFee } = res
          resolve({low: hourFee, mid: halfHourFee, max: fastestFee});
        } catch(e) {
          reject(e)
        }
      } else {
        resolve(btcFees)
      }
    });
  }

  return api;
};