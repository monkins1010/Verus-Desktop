const legacyNetworks = require('agama-wallet-lib/src/bitcoinjs-networks');
const { networks } = require('bitgo-utxo-lib');

module.exports = {
  ...legacyNetworks,
  zec: networks.zcash
};