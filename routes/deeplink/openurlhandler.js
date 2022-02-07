const { dialog } = require('electron')
const { URL } = require('url');
const { SUPPORTED_DLS, CALLBACK_HOST } = require('../api/utils/constants/supported_dls');

function openurlhandler(event, urlstring, apihandler) {
  try {
    const url = new URL(urlstring);

    if (url.host !== CALLBACK_HOST) throw new Error("Unsupported host url.");
    if (!SUPPORTED_DLS.includes(url.pathname.replace(/\//g, "")))
      throw new Error("Unsupported url path.");

    return apihandler(url);
  } catch (e) {
    dialog.showErrorBox(
      "Something went wrong",
      `Error: "${e.message}". For url string: "${urlstring}".`
    );
  }
}

module.exports = openurlhandler