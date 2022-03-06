const { WALLET_VDXF_KEY } = require("verus-typescript-primitives")

function removelink(app) {
  return app.removeAsDefaultProtocolClient(WALLET_VDXF_KEY.vdxfid)
}

module.exports = removelink