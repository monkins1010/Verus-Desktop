module.exports = (api) => {
  // The only difference between this and get_currency is that this cannot
  // be used to derive non-static properties of a currency like bestcurrencystate
  api.native.get_currency_definition = async (chain, currencyid = "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV") => {
    if (api.native.cache.currency_definition_cache.has(currencyid)) {
      return api.native.cache.currency_definition_cache.get(currencyid)
    } else {
      const definition = await api.native.callDaemon(chain, 'getcurrency', [currencyid])
      let { name } = definition

      if (
        definition.currencyid !== definition.systemid &&
        definition.parent !== "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV"
      ) {
        name = `${name}.${
          (await api.native.get_currency_definition(chain, definition.parent))
            .name
        }`;
      }

      const processedDefinition = {
        ...definition,
        name,
      }

      api.native.cache.currency_definition_cache.set(currencyid, processedDefinition)
      return processedDefinition
    }
  }

  api.native.get_currency = async (chain, currencyid = "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV") => {
    try {
      const currencyObject = await api.native.callDaemon(chain, 'getcurrency', [currencyid])
      const parent = await api.native.get_currency_definition(chain, currencyObject.parent)
      const spotter = await api.native.get_currency_definition(chain, chain)

      const processedCurrencyObject = {
        ...currencyObject,
        systemname: parent.name.toUpperCase(),
        spottername: chain,
        spotterid: spotter.currencyid,
        name:
          (currencyObject.systemid !== currencyObject.currencyid &&
          currencyObject.parent !== "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV")
            ? `${currencyObject.name}.${parent.name}`
            : currencyObject.name,
      };

      if (!api.native.cache.currency_definition_cache.has(currencyid)) {
        api.native.cache.currency_definition_cache.set(currencyid, processedCurrencyObject)
      }

      return processedCurrencyObject
    } catch(e) {
      throw e
    }
  };

  api.setPost('/native/get_currency', async (req, res, next) => {
    const { chainTicker, name } = req.body

    try {
      const retObj = {
        msg: 'success',
        result:  await api.native.get_currency(chainTicker, name),
      };
  
      res.send(JSON.stringify(retObj));  
    } catch(e) {
      const retObj = {
        msg: 'error',
        result: e.message,
      };
  
      res.send(JSON.stringify(retObj)); 
    }
  });
 
  return api;
};