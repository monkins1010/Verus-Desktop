const test_request = {
  chain_id: "VRSCTEST",
  signing_id: "login-consent-server@",
  signature: {
    signature:
      "AaYuAAABQSD/UR9NIeimLYyUrkJ7kfjXJz0QiuVsFIt+lEu+KSELCX5zxAlIiciuIHLIzKLsuqMFL3XDapg/1TnV0b6hXoSX",
  },
  challenge: {
    uuid: "7bb518c4eec2454dbb289f5fdb4c0ee2",
    requested_scope: ["vrsc::system.identity.authentication.scope.read-id-name"],
    requested_access_token_audience: null,
    skip: false,
    oidc_context: {},
    request_url: "http://127.0.0.1:4444/oauth2?full=request&url=",
    client: {
      client_id: "auth-code-client",
      name: "Online Service",
      redirect_uris: ["http://127.0.0.1:5555/callback"],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code", "id_token"],
      scope: "vrsc::system.identity.authentication.scope.read-id-name",
      audience: null,
      owner: "",
      policy_uri: "https://verus.io/privacy-policy",
      allowed_cors_origins: null,
      tos_uri: "https://en.wikipedia.org/wiki/Lorem_ipsum",
      client_uri: "https://verus.io/",
      logo_uri:
        "https://github.com/VerusCoin/Media-Assets/blob/master/Logos/PNG%20(pixel)/Logo/verus-icon-blue-500px.png",
      contacts: null,
      client_secret_expires_at: 0,
      subject_type: "public",
      token_endpoint_auth_method: "client_secret_basic",
      userinfo_signed_response_alg: "none",
      created_at: "2020-07-08T12:31:47Z",
      updated_at: "2020-07-08T12:31:47Z",
    },
  },
};

const test_response_no_sig = {
  chain_id: "VRSCTEST",
  signing_id: "login-consent-server@",
  decision: {
    subject: "Client@",
    remember: true,
    remember_for: 7200,
    force_subject_identifier: "string",
    request: test_request,
  },
};
