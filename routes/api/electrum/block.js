
module.exports = (api) => {
  api.setGet('/electrum/getblockinfo', (req, res, next) => {
    api.electrumGetBlockInfo(req.query.height, req.query.network)
    .then((json) => {
      const retObj = {
        msg: 'success',
        result: json,
      };

      res.send(JSON.stringify(retObj));
    });
  });

  api.electrumGetBlockInfo = (height, network) => {
    return new Promise((resolve, reject) => {
      async function _electrumGetBlockInfo() {
        const ecl = await api.ecl(network);

        ecl.blockchainBlockGetHeader(height).then((json) => {
          api.log("electrum getblockinfo ==>", "spv.getblockinfo");
          api.log(json, "spv.getblockinfo");

          resolve(json);
        });
      }
      _electrumGetBlockInfo();
    });
  }

  api.setGet('/electrum/getcurrentblock', (req, res, next) => {
    api.electrumGetCurrentBlock(req.query.network)
    .then((json) => {
      const retObj = {
        msg: 'success',
        result: json,
      };

      res.send(JSON.stringify(retObj));
    });
  });

  api.electrumGetCurrentBlock = (network, returnNspvReq) => {
    return new Promise((resolve, reject) => {
      async function _electrumGetCurrentBlock() {
        const ecl = await api.ecl(network);

        ecl.blockchainHeadersSubscribe().then((json) => {
          if (json && json.hasOwnProperty("block_height")) {
            resolve(json.block_height);
          } else if (json && json.hasOwnProperty("height")) {
            resolve(json.height);
          } else {
            resolve(json);
          }
        });
      };
      _electrumGetCurrentBlock();
    });
  }

  return api;
};