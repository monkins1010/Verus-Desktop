const {
  RPC_INVALID_ADDRESS_OR_KEY
} = require("../utils/rpc/rpcStatusCodes");
const RpcError = require("../utils/rpc/rpcError");
const { SATOSHIS } = require('../utils/constants/math');
const { BigNumber } = require('ethers');

module.exports = (api) => {      
  // Gets an address balance (z_getbalance), txCount and zTotalBalance are used 
  // to check if the cache needs to be cleared and re-built
  api.native.get_addr_balance = async (coin, address, useCache, txCount = -1, zTotalBalance = -1, reserveBalances = {}) => {
    const cacheAddrBalanceResult = (result) => {
      let data = api.native.cache.addr_balance_cache[coin].get("data")
      data[address] = result

      api.native.cache.addr_balance_cache[coin].set("data", data)
    }

    if (useCache) {
      if (
        api.native.cache.addr_balance_cache[coin] != null
      ) {
        if (txCount !== api.native.cache.addr_balance_cache[coin].get("tx_count")) {
          api.native.cache.addr_balance_cache[coin].set("tx_count", txCount)
          api.native.cache.addr_balance_cache[coin].del("data");
        }

        if (zTotalBalance !== api.native.cache.addr_balance_cache[coin].get('total_balance')) {
          api.native.cache.addr_balance_cache[coin].set("total_balance", zTotalBalance)
          if (api.native.cache.addr_balance_cache[coin].get("data") != null) {
            api.native.cache.addr_balance_cache[coin].del("data");
          }
        }

        let reserveBalanceDifference = false
        const reserveBalanceKeys = Object.keys(reserveBalances)
        const cachedReserveBalances = api.native.cache.addr_balance_cache[coin].get('reserve_balances')
        const cachedReserveBalanceKeys = Object.keys(cachedReserveBalances)

        if (reserveBalanceKeys.length !== cachedReserveBalanceKeys.length) reserveBalanceDifference = true
        else {
          for (const key of reserveBalanceKeys) {
            if (cachedReserveBalances[key] !== reserveBalances[key]) {
              reserveBalanceDifference = true;
              break;
            }
          }

          if (!reserveBalanceDifference) {
            for (const key of cachedReserveBalanceKeys) {
              if (cachedReserveBalances[key] !== reserveBalances[key]) {
                reserveBalanceDifference = true;
                break;
              }
            }
          }
        }

        if (reserveBalanceDifference) {
          api.native.cache.addr_balance_cache[coin].set("reserve_balances", reserveBalances)
          if (api.native.cache.addr_balance_cache[coin].get("data") != null) {
            api.native.cache.addr_balance_cache[coin].del("data");
          }
        }
      }
        
      if (api.native.cache.addr_balance_cache[coin] == null) {
        api.native.cache.addr_balance_cache[coin] = api.create_sub_cache(`native.cache.addr_balance_cache.${coin}`)
        api.native.cache.addr_balance_cache[coin].set("tx_count", -1)
        api.native.cache.addr_balance_cache[coin].set("total_balance", -1)
        api.native.cache.addr_balance_cache[coin].set("reserve_balances", {})
        api.native.cache.addr_balance_cache[coin].set("data", {})
      } else if (api.native.cache.addr_balance_cache[coin].get('data') == null) {        
        api.native.cache.addr_balance_cache[coin].set("data", {})
      }
  
      if (api.native.cache.addr_balance_cache[coin].get('data')[address] != null) {  
        return new Promise((resolve, reject) => {
          if (api.native.cache.addr_balance_cache[coin].get('data')[address] instanceof RpcError) {
            reject(api.native.cache.addr_balance_cache[coin].get('data')[address])
          } else resolve(api.native.cache.addr_balance_cache[coin].get('data')[address])
        })
      }
    }

    const isZAddr = address[0] === "z" && address[address.length - 1] !== "@"
    const useGetCurrencyBalance = api.is_pbaas(coin) && !isZAddr;

    try {
      if (useGetCurrencyBalance) {
        // getcurrencybalance
        let balance = await api.native.get_currency_balances(coin, address);
        const balanceCoins = Object.keys(balance);
        const nativeCoin = balanceCoins.find((x) => {
          return x.toLowerCase() === coin.toLowerCase();
        });

        if (nativeCoin != null) {
          balance[coin] = balance[nativeCoin] != null ? balance[nativeCoin] : 0;

          if (coin !== nativeCoin) delete balance[nativeCoin];
        } else balance[coin] = 0;

        if (useCache) cacheAddrBalanceResult(balance);
        return balance;
      } else if (api.is_vrsc(coin) && !isZAddr) {
        // getaddressbalance
        const balanceResult = await api.native.callDaemon(coin, "getaddressbalance", [
          { addresses: [address] },
        ]);
        const balance = {
          [coin]:
            balanceResult == null
              ? 0
              : BigNumber.from(balanceResult.balance).div(BigNumber.from(SATOSHIS)).toNumber(),
        };

        if (useCache) cacheAddrBalanceResult(balance);
        return balance;
      } else {
        // z_getbalance
        const balanceResult = await api.native.callDaemon(coin, "z_getbalance", [address]);
        const balance = {
          [coin]: balanceResult == null ? 0 : Number(balanceResult),
        };

        if (useCache) cacheAddrBalanceResult(balance);
        return balance;
      }
    } catch(e) {
      if (e.code === RPC_INVALID_ADDRESS_OR_KEY) cacheAddrBalanceResult(e)

      throw e
    }
  };

  return api;
};