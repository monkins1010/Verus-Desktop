const server = require("verus_bridgekeeper");

module.exports = (api) => { 
  api.native.start_bridgekeeper = () => {

    try {
      server.alanStart();

    } catch (e) {
      throw new Error("Bridge Keeper failed to start")
    }

  };

  api.native.stop_bridgekeeper = () => {

    try {
      server.alanStop();

    } catch (e) {
      throw new Error("Bridge Keeper failed to stop")
    }

  };

  api.setGet('/native/start_bridgekeeper', (req, res, next) => {    
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
        result: error.message,
      };
  
      res.send(JSON.stringify(retObj));  
    })
  });

  api.setGet('/native/stop_bridgekeeper', (req, res, next) => {    
    api.native.stop_bridgekeeper()
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