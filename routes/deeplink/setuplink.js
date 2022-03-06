const path = require('path')
const { WALLET_VDXF_KEY } = require('verus-typescript-primitives');

function setuplink(app) {
  let res;

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      res = app.setAsDefaultProtocolClient(WALLET_VDXF_KEY.vdxfid, process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    res = app.setAsDefaultProtocolClient(WALLET_VDXF_KEY.vdxfid)
  }

  return res
}

module.exports = setuplink