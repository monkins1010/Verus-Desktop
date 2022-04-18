
const TX_CONFIRMATION_CACHE_THRESHOLD = 100

module.exports = (api) => {      
  // Gets a transaction, with the option of compacting it to to be 
  // a small JSON of essential data (required if cached)
  // The currentheight helps calculate the # of confirmations for 
  // cached transactions. Without it, confirmations will be returned as null.
  // (in this case tx height will be appended to tx obj)
  api.native.get_transaction = async (coin, txid, compact, currentHeight) => {
    if (api.native.cache.tx_cache[coin] == null)
      api.native.cache.tx_cache[coin] = api.create_sub_cache(
        `native.cache.tx_cache.${coin}`
      );

    if (compact && api.native.cache.tx_cache[coin].has(txid)) {
      return new Promise((resolve, reject) => {
        const cachedTx = api.native.cache.tx_cache[coin].get(txid)
        const { blockheight } = cachedTx

        api.native.cache.tx_cache[coin].set(txid, {
          ...cachedTx,
          confirmations:
            currentHeight == null ||
            blockheight == null ||
            currentHeight - blockheight < 0
              ? null
              : currentHeight - blockheight
        })

        resolve(cachedTx);
      })
    }

    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'gettransaction', [txid])
      .then(async (tx) => {
        if (compact) {
          const {
            amount,
            fee,
            confirmations,
            blockhash,
            blockindex,
            blocktime,
            expiryheight,
            walletconflicts,
            time,
            timereceived,
            details
          } = tx

          const compactTx = {
            amount,
            fee,
            confirmations,
            blockhash,
            blockindex,
            blocktime,
            expiryheight,
            walletconflicts,
            time,
            timereceived,
            txid,
            details
          }

          if (tx.confirmations > TX_CONFIRMATION_CACHE_THRESHOLD) {
            let txBlock = await api.native.callDaemon(
              coin,
              "getblock",
              [blockhash]
            )
            
            api.native.cache.tx_cache[coin].set(txid, {
              ...compactTx,
              blockheight: txBlock.height
            })
          }
         
          resolve(compactTx)
        } else resolve(tx)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.setPost('/native/get_transaction', (req, res, next) => {
    const coin = req.body.chainTicker;
    const txid = req.body.txid;
    const compact = req.body.compact;

    api.native.get_transaction(coin, txid, compact)
    .then((txObj) => {
      const retObj = {
        msg: 'success',
        result: txObj,
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