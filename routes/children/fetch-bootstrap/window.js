const { dialog } = require('electron')

async function canFetchBootstrap(chainTicker) {
  return chainTicker === "VRSC"
    ? (
        await dialog.showMessageBox({
          type: "question",
          title: `Bootstrap ${chainTicker}?`,
          message: `Would you like to speed up syncing to the ${chainTicker} blockchain by downloading blockchain data from the internet?`,
          buttons: ["Yes", "No"],
        })
      ).response === 0
    : false;
}

module.exports = {
	canFetchBootstrap,
}