const { checkTimestamp } = require('agama-wallet-lib/src/time');
const { pubToElectrumScriptHashHex } = require('agama-wallet-lib/src/keys');
const btcnetworks = require('agama-wallet-lib/src/bitcoinjs-networks');
const UTXO_1MONTH_THRESHOLD_SECONDS = 2592000;

module.exports = (api) => {
  api.setGet('/electrum/get_balances', (req, res, next) => {
    if (!req.query.chainTicker) {
      res.send(JSON.stringify({
        msg: 'error',
        result: 'No coin passed to electrum get_balances',
      }));
    }
    const coinLc = req.query.chainTicker.toLowerCase()

    if (!api.electrumKeys[coinLc] || !api.electrumKeys[coinLc].pub) {
      res.send(JSON.stringify({
        msg: 'error',
        result: `No address found for ${req.query.chainTicker}`,
      }));
    }
    
    api.electrum.get_balances(
      api.electrumKeys[coinLc].pub,
      req.query.chainTicker
    )
    .then(balanceObj => {
      const retObj = {
        msg: 'success',
        result: {
          native: {
            public: {
              confirmed: balanceObj.confirmed,
              unconfirmed: balanceObj.unconfirmed,
              immature: null,
              interest: balanceObj.interest
            },
            private: {
              confirmed: null
            }
          },
          reserve: {}
        },
      };

      res.send(JSON.stringify(retObj));
    })
    .catch(e => {
      const retObj = {
        msg: 'error',
        result: e.message
      };

      res.send(JSON.stringify(retObj));
    })
  });

  api.electrum.get_balances = (address, coin) => {
    return new Promise(async (resolve, reject) => {
      try {
        const network = api.validateChainTicker(coin);
        let ecl;
        let _address = address;

        ecl = await api.ecl(network);
        _address =
          ecl.protocolVersion && ecl.protocolVersion === "1.4"
            ? pubToElectrumScriptHashHex(
                address,
                btcnetworks[network.toLowerCase()] || btcnetworks.kmd
              )
            : address;

        ecl
          .blockchainAddressGetBalance(_address)
          .then((json) => {
            if (json && json.hasOwnProperty("confirmed") && json.hasOwnProperty("unconfirmed")) {
              if (network === "komodo" || network.toLowerCase() === "kmd") {
                ecl
                  .blockchainAddressListunspent(_address)
                  .then((utxoList) => {
                    if (utxoList && utxoList.length) {
                      // filter out < 10 KMD amounts
                      let _utxo = [];
                      let utxoIssues = false;

                      for (let i = 0; i < utxoList.length; i++) {
                        if (Number(utxoList[i].value) * 0.00000001 >= 10) {
                          _utxo.push(utxoList[i]);
                        } else {
                          utxoIssues = true;
                        }
                      }

                      if (_utxo && _utxo.length) {
                        let interestTotal = 0;

                        if (api.electrum.coinData[network.toLowerCase()].nspv) {
                          let _utxosNspv = [];

                          for (let i = 0; i < _utxo.length; i++) {
                            interestTotal += Number(_utxo[i].rewards);
                          }

                          resolve({
                            confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                            unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                            utxoIssues: false,
                            interest:
                              interestTotal === 0 || interestTotal < 0
                                ? null
                                : Number((0.00000001 * interestTotal).toFixed(8)),
                          });
                        } else {
                          Promise.all(
                            _utxo.map((_utxoItem, index) => {
                              return new Promise((resolve, reject) => {
                                api
                                  .getTransaction(_utxoItem.tx_hash, network, ecl)
                                  .then((_rawtxJSON) => {

                                    // decode tx
                                    const _network = api.getNetworkData(network);
                                    let decodedTx;

                                    if (api.getTransactionDecoded(_utxoItem.tx_hash, network)) {
                                      decodedTx = api.getTransactionDecoded(
                                        _utxoItem.tx_hash,
                                        network
                                      );
                                    } else {
                                      decodedTx = api.electrumJSTxDecoder(
                                        _rawtxJSON,
                                        network,
                                        _network
                                      );
                                      api.getTransactionDecoded(
                                        _utxoItem.tx_hash,
                                        network,
                                        decodedTx
                                      );
                                    }

                                    if (
                                      decodedTx &&
                                      decodedTx.format &&
                                      decodedTx.format.locktime > 0
                                    ) {
                                      interestTotal += api.kmdCalcInterest(
                                        decodedTx.format.locktime,
                                        _utxoItem.value,
                                        _utxoItem.height
                                      );

                                      const _locktimeSec = checkTimestamp(
                                        decodedTx.format.locktime * 1000
                                      );
                                      const interestRulesCheckPass =
                                        !decodedTx.format.locktime ||
                                        Number(decodedTx.format.locktime) === 0 ||
                                        _locktimeSec > UTXO_1MONTH_THRESHOLD_SECONDS
                                          ? false
                                          : true;

                                      if (!interestRulesCheckPass) {
                                        utxoIssues = true;
                                      }
                                      api.log(
                                        `interest ${interestTotal} for txid ${_utxoItem.tx_hash}`,
                                        "interest"
                                      );
                                    }

                                    resolve(true);
                                  });
                              });
                            })
                          ).then(() => {
                            resolve({
                              confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                              unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                              utxoIssues,
                              interest:
                                interestTotal === 0 || interestTotal < 0
                                  ? null
                                  : Number((0.00000001 * interestTotal).toFixed(8)),
                            });
                          });
                        }
                      } else {
                        resolve({
                          confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                          unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                          interest: 0,
                        });
                      }
                    } else {
                      resolve({
                        confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                        unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                        interest: 0,
                      });
                    }
                  })
                  .catch((e) => reject(e));
              } else {
                resolve({
                  confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                  unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                  interest: null,
                });
              }
            } else {
              reject(new Error(api.CONNECTION_ERROR_OR_INCOMPLETE_DATA));
            }
          })
          .catch((e) => {
            reject(e)
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  return api;
};