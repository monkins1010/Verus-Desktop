const path = require('path');
const fixPath = require('fix-path');
const os = require('os');

const pathsAgama = (api, home) => {
  if (!api) api = { paths: {} };
  else if (!api.paths) api.paths = {};

  if (global.USB_MODE) {
    if (os.platform() === 'darwin') fixPath()

    api.paths.VerusDesktopDir = `${home}/Verus-Desktop-Testnet`;
    api.paths.agamaDir = `${home}/Verus-Desktop-Testnet/appdata`;
    api.paths.pluginsDir = `${home}/Verus-Desktop-Testnet/plugins`;
    api.paths.pluginsTempDir = `${home}/Verus-Desktop-Testnet/plugins/tmp`;
    api.paths.crashesDir = `${home}/Verus-Desktop-Testnet/crashes`;
    api.paths.backupDir = `${home}/Verus-Desktop-Testnet/backups`;

    if (os.platform() === 'win32') {
      api.paths.VerusDesktopDir = path.normalize(api.paths.VerusDesktopDir);
      api.paths.agamaDir = path.normalize(api.paths.agamaDir);
      api.paths.pluginsDir = path.normalize(api.paths.pluginsDir);
      api.paths.pluginsTempDir = path.normalize(api.paths.pluginsTempDir);
      api.paths.crashesDir = path.normalize(api.paths.crashesDir);
      api.paths.backupDir = path.normalize(api.paths.backupDir);
    }

    return api;
  } else {
    switch (os.platform()) {
      case "darwin":
        fixPath();
        api.paths.VerusDesktopDir = `${home}/Library/Application Support/Verus-Desktop-Testnet`;

        api.paths.agamaDir = `${home}/Library/Application Support/Verus-Desktop-Testnet/appdata`;
        api.paths.pluginsDir = `${home}/Library/Application Support/Verus-Desktop-Testnet/plugins`;
        api.paths.pluginsTempDir = `${home}/Library/Application Support/Verus-Desktop-Testnet/plugins/tmp`;
        api.paths.crashesDir = `${home}/Library/Application Support/Verus-Desktop-Testnet/crashes`;
        api.paths.backupDir = `${home}/Library/Application Support/Verus-Desktop-Testnet/backups`;
        return api;
        break;

      case "linux":
        api.paths.VerusDesktopDir = `${home}/.verus-desktop-testnet`;

        api.paths.agamaDir = `${home}/.verus-desktop-testnet/appdata`;
        api.paths.pluginsDir = `${home}/.verus-desktop-testnet/plugins`;
        api.paths.pluginsTempDir = `${home}/.verus-desktop-testnet/plugins/tmp`;
        api.paths.crashesDir = `${home}/.verus-desktop-testnet/crashes`;
        api.paths.backupDir = `${home}/.verus-desktop-testnet/backups`;
        return api;
        break;

      case "win32":
        api.paths.VerusDesktopDir = `${home}/Verus-Desktop-Testnet`;
        api.paths.VerusDesktopDir = path.normalize(api.paths.VerusDesktopDir);

        api.paths.agamaDir = `${home}/Verus-Desktop-Testnet/appdata`;
        api.paths.agamaDir = path.normalize(api.paths.agamaDir);

        api.paths.pluginsDir = `${home}/Verus-Desktop-Testnet/plugins`;
        api.paths.pluginsDir = path.normalize(api.paths.pluginsDir);

        api.paths.pluginsTempDir = `${home}/Verus-Desktop-Testnet/plugins/tmp`;
        api.paths.pluginsTempDir = path.normalize(api.paths.pluginsTempDir);
        
        api.paths.crashesDir = `${home}/Verus-Desktop-Testnet/crashes`;
        api.paths.crashesDir = path.normalize(api.paths.crashesDir);

        api.paths.backupDir = `${home}/Verus-Desktop-Testnet/backups`;
        api.paths.backupDir = path.normalize(api.paths.backupDir);
        return api;
        break;
    }
  }
};

const pathsDaemons = (api) => {
  if (!api) api = { paths: {} };
  else if (!api.paths) api.paths = {};

  if (global.USB_MODE) {
    switch (os.platform()) {
      case 'darwin':
        fixPath();
        api.paths.assetsFolder = path.join(__dirname, '../../assets/bin/osx'),
        api.paths.kmdDataDir = `${global.HOME}/Komodo`,
        api.paths.vrscDataDir = `${global.HOME}/Komodo/VRSC`,
        api.paths.verusDir = `${global.HOME}/Verus`,
        api.paths.verusTestDir = `${global.HOME}/VerusTest`,
        api.paths.zcashParamsDir = `${global.HOME}/ZcashParams`,
        api.paths.chipsDir = `${global.HOME}/Chips`,
        api.paths.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/darwin/x64/marketmaker');
        return api;
        break;

      case 'linux':
        api.paths.assetsFolder = path.join(__dirname, '../../assets/bin/linux64'),
        api.paths.kmdDataDir = `${global.HOME}/Komodo`,
        api.paths.vrscDataDir = `${global.HOME}/Komodo/VRSC`,
        api.paths.verusDir = `${global.HOME}/Verus`,
        api.paths.verusTestDir = `${global.HOME}/VerusTest`,
        api.paths.zcashParamsDir = `${global.HOME}/ZcashParams`,
        api.paths.chipsDir = `${global.HOME}/Chips`,
        api.paths.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/linux/x64/marketmaker');
        return api;
        break;

      case 'win32':
        api.paths.assetsFolder = path.join(__dirname, '../../assets/bin/win64'),
        api.paths.assetsFolder = path.normalize(api.paths.assetsFolder),
        api.paths.kmdDataDir = `${global.HOME}/Komodo`,
        api.paths.kmdDataDir = path.normalize(api.paths.kmdDataDir),
        api.paths.vrscDataDir = `${global.HOME}/Komodo/VRSC`,
        api.paths.vrscDataDir = path.normalize(api.paths.vrscDataDir),
        api.paths.verusDir = `${global.HOME}/Verus`,
        api.paths.verusDir = path.normalize(api.paths.verusDir),
        api.paths.verusTestDir = `${global.HOME}/VerusTest`,
        api.paths.verusTestDir = path.normalize(api.paths.verusTestDir),
        api.paths.chipsDir = `${global.HOME}/Chips`,
        api.paths.chipsDir = path.normalize(api.paths.chipsDir);
        api.paths.zcashParamsDir = `${global.HOME}/ZcashParams`;
        api.paths.zcashParamsDir = path.normalize(api.paths.zcashParamsDir);
        api.paths.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/win32/x64/marketmaker.exe');
        api.paths.mmBin = path.normalize(api.paths.mmBin);
        return api;
        break;
    }
  } else {
    switch (os.platform()) {
      case 'darwin':
        fixPath();
        api.paths.assetsFolder = path.join(__dirname, '../../assets/bin/osx'),
        api.paths.kmdDataDir = `${global.HOME}/Library/Application Support/Komodo`,
        api.paths.vrscDataDir = `${global.HOME}/Library/Application Support/Komodo/VRSC`,
        api.paths.verusDir = `${global.HOME}/Library/Application Support/Verus`,
        api.paths.verusTestDir = `${global.HOME}/Library/Application Support/VerusTest`,
        api.paths.zcashParamsDir = `${global.HOME}/Library/Application Support/ZcashParams`,
        api.paths.chipsDir = `${global.HOME}/Library/Application Support/Chips`,
        api.paths.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/darwin/x64/marketmaker');
        api.paths[`vrsc-fetch-bootstrap`] = path.join(__dirname, `../../assets/bin/osx/verusd/fetch-bootstrap`);
        return api;
        break;

      case 'linux':
        api.paths.assetsFolder = path.join(__dirname, '../../assets/bin/linux64'),
        api.paths.kmdDataDir = `${global.HOME}/.komodo`,
        api.paths.vrscDataDir = `${global.HOME}/.komodo/VRSC`,
        api.paths.verusDir = `${global.HOME}/.verus`,
        api.paths.verusTestDir = `${global.HOME}/.verustest`,
        api.paths.zcashParamsDir = `${global.HOME}/.zcash-params`,
        api.paths.chipsDir = `${global.HOME}/.chips`,
        api.paths.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/linux/x64/marketmaker');
        api.paths[`vrsc-fetch-bootstrap`] = path.join(__dirname, `../../assets/bin/linux64/verusd/fetch-bootstrap`);
        return api;
        break;

      case 'win32':
        api.paths.assetsFolder = path.join(__dirname, '../../assets/bin/win64'),
        api.paths.assetsFolder = path.normalize(api.paths.assetsFolder),
        api.paths.kmdDataDir = `${global.HOME}/Komodo`,
        api.paths.kmdDataDir = path.normalize(api.paths.kmdDataDir),
        api.paths.vrscDataDir = `${global.HOME}/Komodo/VRSC`,
        api.paths.vrscDataDir = path.normalize(api.paths.vrscDataDir),
        api.paths.verusDir = `${global.HOME}/Verus`,
        api.paths.verusDir = path.normalize(api.paths.verusDir),
        api.paths.verusTestDir = `${global.HOME}/VerusTest`,
        api.paths.verusTestDir = path.normalize(api.paths.verusTestDir),
        api.paths.chipsDir = `${global.HOME}/Chips`,
        api.paths.chipsDir = path.normalize(api.paths.chipsDir);
        api.paths.zcashParamsDir = `${global.HOME}/ZcashParams`;
        api.paths.zcashParamsDir = path.normalize(api.paths.zcashParamsDir);
        api.paths.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/win32/x64/marketmaker.exe');
        api.paths.mmBin = path.normalize(api.paths.mmBin);
        api.paths[`vrsc-fetch-bootstrap`] = path.join(__dirname, `../../assets/bin/win64/verusd/fetch-bootstrap.bat`),
        api.paths[`vrsc-fetch-bootstrap`] = path.normalize(api.paths[`vrsc-fetch-bootstrap`]);
        return api;
        break;
    }
  }

}

const setDaemonPath = (api, daemonName) => {
  if (!api) api = { paths: {} };
  else if (!api.paths) api.paths = {};

  let binName = daemonName + "Bin";
  switch (os.platform()) {
    case 'darwin':
      fixPath();
      api.paths[binName] = path.join(__dirname, `../../assets/bin/osx/${daemonName}/${daemonName}`);
      return api;
      break;
    case 'linux':
      api.paths[binName] = path.join(__dirname, `../../assets/bin/linux64/${daemonName}/${daemonName}`);
      return api;
      break;
    case 'win32':
      api.paths[binName] = path.join(__dirname, `../../assets/bin/win64/${daemonName}/${daemonName}.exe`),
      api.paths[binName] = path.normalize(api.paths[binName]);
      return api;
      break;
  }
}

const setCoinDir = (api, coin, dirNames, absolute = false) => {
  if (!api) api = { paths: {} };
  else if (!api.paths) api.paths = {};
  const { darwin, linux, win32 } = dirNames

  let dirName = coin.toLowerCase() + "DataDir";
  switch (os.platform()) {
    case 'darwin':
      fixPath();
      api.paths[dirName] = absolute
        ? darwin
        : global.USB_MODE
        ? `${global.HOME}/${darwin}`
        : `${global.HOME}/Library/Application Support/${darwin}`;
      return api;
    case 'linux':
      api.paths[dirName] = absolute ? linux : `${global.HOME}/${linux}`
      return api;
    case 'win32':
      api.paths[dirName] = absolute ? win32 : `${global.HOME}/${win32}`,
      api.paths[dirName] = path.normalize(api.paths[dirName]);
      return api;
  }
}

module.exports = {
  pathsAgama,
  pathsDaemons,
  setDaemonPath,
  setCoinDir
};
