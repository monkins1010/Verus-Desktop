const {
  VerusIDSignature,
  LoginConsentResponse,
  LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY,
} = require("verus-typescript-primitives");

module.exports = (api) => {
  api.native.verusid.login.sign_response = async (response) => {
    const loginResponse = new LoginConsentResponse(response);

    const verificatonCheck = await api.native.verusid.login.verify_request(
      loginResponse.decision.request
    );

    if (!verificatonCheck.verified) {
      throw new Error(verificatonCheck.message);
    }

    const subject = loginResponse.decision.request.challenge.subject;
    if (subject != null && loginResponse.signing_id !== subject)
      throw new Error("Cannot sign request for different user.");

    const userSignature = await api.native.sign_message(
      loginResponse.chain_id,
      loginResponse.signing_id,
      loginResponse.getSignedData()
    );

    loginResponse.signature = new VerusIDSignature(
      { signature: userSignature.signature },
      LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY
    );

    return { response: loginResponse.stringable() };
  };

  api.setPost("/native/verusid/login/sign_response", async (req, res, next) => {
    const { response } = req.body;

    try {
      res.send(
        JSON.stringify({
          msg: "success",
          result: await api.native.verusid.login.sign_response(response),
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
