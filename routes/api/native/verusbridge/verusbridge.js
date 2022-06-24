const server = require("verus_bridgekeeper");

module.exports = (api) => { 

  api.native.start_bridgekeeper = () => {
    return new Promise((resolve, reject) => {

      const setupConf = api.native.loadVethConfig();

      if (setupConf !== true) {
        reject(setupConf);
      } else {
        server.start().then((result) => {
          if(result === true)
          resolve(result)
          else
            reject(result)
        })
      }
    })
  };

  api.native.stop_bridgekeeper = () => {
    return new Promise((resolve, reject) => {
      const result = server.stop()
      
      if(result === true)
       resolve(result)
      else
        reject(result)
    })
  };

  api.native.bridgekeeper_status = () => {
    return new Promise((resolve, reject) => {
      const result = server.status()
      
      if(result)
       resolve(result)
      else
        reject(result)
    })
  };

  api.setPost('/native/start_bridgekeeper', (req, res, next) => {    
    api.native.start_bridgekeeper()
    .then((reply) => {
      const retObj = {
        msg: 'success',
        result: reply,
      };
  
      res.send(JSON.stringify(retObj));  
    })
    .catch(error => {
      const retObj = {
        msg: 'error',
        result: error,
      };
  
      res.send(JSON.stringify(retObj));  
    })
  });

  api.setPost('/native/stop_bridgekeeper', (req, res, next) => {    
    api.native.stop_bridgekeeper()
    .then((reply) => {
      const retObj = {
        msg: 'BridgeKeeper Stopped',
        result: reply,
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

  api.setPost('/native/bridgekeeper_status', (req, res, next) => {    
    api.native.bridgekeeper_status()
    .then((reply) => {
      const retObj = {
        msg: 'success',
        result: reply,
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