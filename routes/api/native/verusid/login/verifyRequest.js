const { LoginConsentRequest } = require("verus-typescript-primitives")

module.exports = (api) => {
  /**
   * Verifies a login request
   * @param {LoginConsentRequest} Request
   */
  api.native.verusid.login.verify_request = async (request) => {
    const loginConsentRequest = new LoginConsentRequest(request);

    const verified = await api.native.verify_message(
      loginConsentRequest.chain_id,
      loginConsentRequest.signing_id,
      loginConsentRequest.getSignedData(),
      loginConsentRequest.signature.signature
    );

    return verified ? { verified } : { verified, message: "Failed to verify signature" };
  };

  api.setPost("/native/verusid/login/verify_request", async (req, res, next) => {
    const { request } = req.body;

    try {
      res.send(
        JSON.stringify({
          msg: "success",
          result: await api.native.verusid.login.verify_request(request),
        })
      );
    } catch (e) {
      res.send(
        JSON.stringify({
          msg: "error",
          result: e.message,
        })
      );
    }
  });

  return api;
};
