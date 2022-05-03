module.exports = (api) => {    
  api.native.get_currency_balances = async (coin, address = "*", minconfs = 1) => {
    const iAddrBalances = await api.native.callDaemon(
      coin,
      "getcurrencybalance",
      [address, minconfs, false]
    );
    let formattedBalances = {}

    for (const iAddr in iAddrBalances) {
      const currencyDefinition = await api.native.get_currency_definition(coin, iAddr)

      formattedBalances[currencyDefinition.fullyqualifiedname] = iAddrBalances[iAddr]
    }

    return formattedBalances
  }

  api.native.get_balances = async (coin, includePrivate) => {
    const getBalanceSchema = () => {
      return {
        public: {
          confirmed: 0,
          unconfirmed: null,
          immature: null,
          interest: null,
          staking: null,
        },
        private: {
          confirmed: null,
        },
      }
    }
    
    let publicBalances, privateBalances;

    publicBalances = await api.native.callDaemon(coin, 'getwalletinfo', [])
    if (includePrivate || coin === 'KMD') privateBalances = await api.native.callDaemon(coin, 'z_gettotalbalance', [])
    //KMD Interest is only found in z_gettotalbalance

    let balances = {
      native: getBalanceSchema(),
      reserve: {}
    }

    balances.native.public.confirmed = Number(publicBalances['balance'])
    balances.native.public.unconfirmed = Number(publicBalances['unconfirmed_balance'])
    balances.native.public.immature = Number(publicBalances['immature_balance'])
    balances.native.public.staking = Number(publicBalances['eligible_staking_balance'])

    if (publicBalances["reserve_balance"] != null || publicBalances["unconfirmed_reserve_balance"] != null) {
      const confirmedReserveBalances = await api.native.get_currency_balances(coin, "*", 1)
      const unconfirmedReserveBalances = await (async () => {
        const allIAddrBalances = await api.native.callDaemon(coin, 'getcurrencybalance', ["*", 0, false])
        let formattedReserveBalances = {}

        for (const iAddr in allIAddrBalances) {
          const currencyDefinition = await api.native.get_currency_definition(coin, iAddr)

          formattedReserveBalances[currencyDefinition.name] =
            allIAddrBalances[iAddr] -
            (confirmedReserveBalances[currencyDefinition.name]
              ? confirmedReserveBalances[currencyDefinition.name]
              : 0);
        }

        return formattedReserveBalances
      })()

      // TODO: Implement
      const immature_reserve_balance = {
        key: "immature",
        balance: {},
      };

      const reserve_balance = {
        key: "confirmed",
        balance: confirmedReserveBalances
      };
      const unconfirmed_reserve_balance = {
        key: "unconfirmed",
        balance: unconfirmedReserveBalances
      };

      const reserve_balances = {
        immature_reserve_balance,
        reserve_balance,
        unconfirmed_reserve_balance,
      };

      Object.keys(reserve_balances).map((reserve_balance_key) => {
        Object.keys(reserve_balances[reserve_balance_key].balance).map(
          (currency) => {
            if (currency.toUpperCase() !== coin.toUpperCase()) {
              if (balances.reserve[currency] == null) {
                balances.reserve[currency] = getBalanceSchema();
              }
              
              balances.reserve[currency].public[
                reserve_balances[reserve_balance_key].key
              ] = reserve_balances[reserve_balance_key].balance[currency];
            }
          }
        );
      });
    }
    
    if (privateBalances != null) {
      balances.native.private.confirmed = Number(privateBalances['private'])
      balances.native.public.interest = Number(privateBalances['interest'])
    }

    return balances
  };

  api.setPost('/native/get_balances', (req, res, next) => {
    const includePrivate = req.body.includePrivate;
    const coin = req.body.chainTicker;

    api.native.get_balances(coin, includePrivate)
    .then((balances) => {
      const retObj = {
        msg: 'success',
        result: balances,
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