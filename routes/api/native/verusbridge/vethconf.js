const fs = require("fs-extra");
const os = require("os");
const path = require("path");
var ini = require("ini");
const fixPath = require("fix-path");

const INIKeys = {
  rpcuser: "",
  rpcpassword: "",
  rpcport: "",
  rpchost: "",
  delegatorcontractaddress: "",
  testnet: "",
  privatekey: "",
  ethnode: "",
};

const pbaasRootOptions = {
  VRSCTEST: {
    darwin: "/VerusTest",
    linux: "/.verustest",
    win32: "/VerusTest",
  },
  VRSC: {
    darwin: "/Verus",
    linux: "/.verus",
    win32: "/Verus",
  },
};

const vethFolder = {
  "000b090bec6c9ff28586eb7ed24e77562f0c4667": {
    darwin: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667",
    linux: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667",
    win32: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667",
  },
};

const RPCDefault = {
  VRSCTEST: {
    rpcuser: "user",
    rpcpassword: "password",
    rpcport: 8000,
    rpchost: "127.0.0.1",
    delegatorcontractaddress: "empty",
    testnet: true,
    privatekey: "empty",
    ethnode: "empty",
  },
  VRSC: {
    rpcuser: "username",
    rpcpassword: "password",
    rpcport: 8000,
    rpchost: "127.0.0.1",
    delegatorcontractaddress: "empty",
    testnet: false,
    privatekey: "empty",
    ethnode: "wss://rinkeby.infura.io/ws/v3/........",
  },
};

module.exports = (api) => {
  api.native.loadVethConfig = () => {
    const VETH = "000b090bec6c9ff28586eb7ed24e77562f0c4667";

    let chaintc = "VRSCTEST"; //chainName.toUpperCase();

    let Config = INIKeys;
    const pbaasFolder = vethFolder[VETH];
    const pbaasRoot = pbaasRootOptions[chaintc];

    let confPath;

    switch (os.platform()) {
      case "darwin":
        fixPath();
        confPath =
          `${global.HOME}/Library/Application Support` + pbaasRoot.darwin + pbaasFolder.darwin;
        break;
      case "win32":
        confPath = `${global.HOME}` + pbaasRoot.win32 + pbaasFolder.win32;
        confPath = path.normalize(confPath);
        break;
      case "linux":
        confPath = `${global.HOME}` + pbaasRoot.linux + pbaasFolder.linux;
        break;
    }

    if (!fs.existsSync(confPath)) {
      fs.mkdirSync(confPath, { recursive: true });
    }

    let _data = {};
    try {
      _data = fs.readFileSync(confPath + "/" + VETH + ".conf", "utf8");
    } catch (error) {
      if (error.code != "ENOENT") {
        api.log("Error reading file at: " + confPath + "\nError: " + error.message, "vethconf");
        return new Error("Error reading file at: ", confPath + "\nError: " + error.message);
      }
    }

    if (_data.length && fs.existsSync(confPath + "/" + VETH + ".conf")) {
      let _match;

      api.log("(veth.conf) file found at: " + confPath, "vethconf");
      for (const [key, value] of Object.entries(Config)) {
        if ((_match = _data.match(`${key}` + "=\\n*(.*)"))) {
          if (_match[1] != "empty" || key == "privatekey") {
            Config[key] = _match[1];
          } else {
            api.log("Empty veth.conf file value: " + `${key}:"empty" `, "vethconf");
            return new Error("Empty veth.conf file value: " + `${key}:"empty" `);
          }
        }
      }
    } else {
      try {
        fs.writeFileSync(confPath + "/" + VETH + ".conf", "", "utf8");
      } catch (e) {
        return new Error("Error writing veth.conf: ", e.message);
      }

      for (const [key, value] of Object.entries(RPCDefault[chaintc])) {
        fs.appendFileSync(confPath + "/" + VETH + ".conf", `${key}=${value}` + "\n");
      }

      let tempvalues = fs.readFileSync(confPath + "/" + VETH + ".conf", "utf8");

      const errorMsg =
        "Please check veth.conf file located at: " +
        path.normalize(confPath + "/" + VETH + ".conf") +
        "/n" +
        "Default Values:\n" +
        JSON.stringify(ini.parse(tempvalues, "utf-8"));
        api.log(errorMsg, "vethconf");
      return new Error("Please complete the Bridge setup using the gear icon");
    }
    return true;
  };

  return api;
};
