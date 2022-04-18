const { BuiltinPlugins } = require('./utils/plugin/builtin.js');

module.exports = (api) => {
  api.construct = function () {
    api.appConfig = api._appConfig.config;
    api.pathsAgama();
    api.pathsDaemons();

    api.initMainCache();

    api.firstRun = api.createAgamaDirs();
    api.appConfig = api.loadLocalConfig();
    api.plugins = {
      registry: api.loadLocalPluginRegistry(),
      builtin: BuiltinPlugins,
    };

    api.appConfigSchema = api._appConfig.schema;
    api.defaultAppConfig = Object.assign({}, api.appConfig);
    api.kmdMainPassiveMode = false;

    api.native.cache.currency_definition_cache = api.create_sub_cache(
      "native.cache.currency_definition_cache"
    );

    api.seed = null;

    // init electrum connection manager loop
    api.initElectrumManager();

    api.printDirs();

    // default route
    api.setGet("/", (req, res, next) => {
      res.send("Agama app server2");
    });

    // expose sockets obj
    api.setIO = (io) => {
      api.io = io;
    };

    api.setVar = (_name, _body) => {
      api[_name] = _body;
    };

    if (api.appConfig.general.electrum && api.appConfig.general.electrum.customServers) {
      api.loadElectrumServersList();
    } else {
      api.mergeLocalKvElectrumServers();
    }

    api.checkCoinConfigIntegrity();
  };

  return api;
};
