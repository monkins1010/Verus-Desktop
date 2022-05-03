
const { IS_PBAAS_FLAG, IS_GATEWAY_FLAG } = require('../utils/constants/currency_flags');
const checkFlag = require('../utils/flags');

module.exports = (api) => {    
  api.native.get_network_graph = async (
    root,
  ) => {
    const networkGraph = {
      currencies: {},
      links: {},
      names: {},
    };
    const allCurrenciesRoot = await api.native.get_all_currencies(root);
    const allBlockchains = allCurrenciesRoot.filter((currency) =>
      checkFlag(currency.options, IS_PBAAS_FLAG)
    );

    function getGroupId(currency) {
      return currency.gateway && checkFlag(currency.options, IS_GATEWAY_FLAG)
        ? currency.gateway
        : currency.systemid;
    }

    function addCurrenciesByGroupId(currencies) {
      for (const currency of currencies) {
        const currencyGroupId = getGroupId(currency)

        if (networkGraph.currencies[currencyGroupId] == null)
          networkGraph.currencies[currencyGroupId] = {};

        networkGraph.currencies[currencyGroupId][currency.currencyid] = currency;
        networkGraph.names[currency.currencyid] = currency.fullyqualifiedname;
      }
    }

    function addLink(currencyid, link) {
      if (networkGraph.links[currencyid] == null) networkGraph.links[currencyid] = [];
      networkGraph.links[currencyid].push(link);
    }

    function addLinksFromConversionPaths(sourceCurrencyId, paths) {
      for (const path of paths) {
        if (path.via) {
          // Deconstruct via and add link for each move
          addLink(sourceCurrencyId, {
            destination: path.via.currencyid,
            price: path.viapriceinroot,
          });

          addLink(path.via.currencyid, {
            destination: path.destination.currencyid,
            price: path.destpriceinvia,
          });
        } else {
          addLink(sourceCurrencyId, {
            destination: path.destination.currencyid,
            price: path.price,
          });
        }
      }
    }

    // Fill graph nodes with currencies separated by systemid, and draw links from
    // conversion paths from each blockchain
    addCurrenciesByGroupId(allCurrenciesRoot);
    for (const blockchain of allBlockchains) {
      try {
        const chainId = blockchain.fullyqualifiedname.toUpperCase();

        const allCurrenciesChain = await api.native.get_all_currencies(chainId);
        addCurrenciesByGroupId(allCurrenciesChain);

        const conversionPaths = await api.native.get_conversion_paths(chainId, chainId, null, true);

        addLinksFromConversionPaths(
          blockchain.currencyid,
          (Object.values(conversionPaths)).flat()
        );
      } catch (e) {
        // TODO: Error check for chain not active
      }
    }

    // Remove duplicate links
    for (const key in networkGraph.links) {
      networkGraph.links[key] = networkGraph.links[key].filter(
        (value, index, self) =>
          index ===
          self.findIndex((x) => x.price === value.price && x.destination === value.destination)
      );
    }

    return networkGraph;
  };

  api.setPost('/native/get_network_graph', async (req, res, next) => {
    const { chainTicker } = req.body

    try {
      const retObj = {
        msg: 'success',
        result:  await api.native.get_network_graph(chainTicker),
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