const fs = require('fs-extra');
const http = require('http')
const https = require('https')
const axios = require('axios')

module.exports = (api) => {
  /**
   * Promise based download file method
   */
  api.downloadFile = (configuration) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Save variable to know progress
        let receivedBytes = 0;
        let totalBytes = 0;
        const httpAgent = new http.Agent({ keepAlive: true });
        const httpsAgent = new https.Agent({ keepAlive: true });

        const req = await axios({
          method: 'get',
          url: configuration.remoteFile,
          responseType: 'stream',
          httpAgent,
          httpsAgent,
        })

        let out = fs.createWriteStream(configuration.localFile);
        req.data.pipe(out);

        req.data.on("response", (data) => {
          // Change the total bytes value to get progress later.
          totalBytes = parseInt(data.headers["content-length"]);
        });

        // Get progress if callback exists
        if (configuration.hasOwnProperty("onProgress")) {
          req.data.on("data", (chunk) => {
            // Update the received bytes
            receivedBytes += chunk.length;
            configuration.onProgress(receivedBytes, totalBytes);
          });
        } else {
          req.data.on("data", (chunk) => {
            // Update the received bytes
            receivedBytes += chunk.length;
          });
        }

        req.data.on("end", () => {
          resolve();
        });
      } catch (e) {
        reject(e);
      }
      
    });
  }

  return api;
};