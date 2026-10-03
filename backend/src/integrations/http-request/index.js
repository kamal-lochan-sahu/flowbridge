const axios = require("axios");
const { assertPublicUrl, httpAgent, httpsAgent } = require("../../utils/netGuard");

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
const MAX_BYTES   = 5 * 1024 * 1024;
const MAX_TIMEOUT = 60000;

const execute = async (actionType, config, credentials) => {
  switch (actionType) {
    case "request": return await makeRequest(config, credentials);
    default: throw new Error(`Unknown HTTP action: ${actionType}`);
  }
};

const makeRequest = async (config, credentials) => {
  const {
    url, method = "POST",
    headers = {}, body = {},
    authType = "none",
    timeout  = 30000,
  } = config;

  if (!url) throw new Error("HTTP Request: 'url' is required");

  const upperMethod = String(method).toUpperCase();
  if (!ALLOWED_METHODS.includes(upperMethod)) throw new Error(`HTTP Request: method '${method}' not allowed`);

  // SSRF: literal-IP / scheme / userinfo check here; hostnames are checked at DNS time by the agents
  assertPublicUrl(url);

  // Build auth headers
  const authHeaders = {};
  if (authType === "bearer" && credentials?.api_key) {
    authHeaders["Authorization"] = `Bearer ${credentials.api_key}`;
  } else if (authType === "basic" && credentials?.username) {
    const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");
    authHeaders["Authorization"] = `Basic ${encoded}`;
  } else if (authType === "api_key" && credentials?.api_key) {
    authHeaders[credentials.header_name || "X-API-Key"] = credentials.api_key;
  }

  const requestConfig = {
    url, method: upperMethod,
    headers: { "Content-Type": "application/json", ...headers, ...authHeaders },
    timeout: Math.min(Number(timeout) || 30000, MAX_TIMEOUT),
    validateStatus: null, // Don't throw on non-2xx
    proxy: false,         // ignore HTTP(S)_PROXY env — would bypass the guard
    httpAgent, httpsAgent,
    maxRedirects: 3,
    beforeRedirect: (options) => {
      assertPublicUrl(options.href || `${options.protocol}//${options.hostname}${options.path || ""}`);
    },
    maxContentLength: MAX_BYTES,
    maxBodyLength:    MAX_BYTES,
  };

  if (["POST", "PUT", "PATCH"].includes(upperMethod)) {
    requestConfig.data = body;
  }

  const response = await axios(requestConfig);

  console.log(`✅ HTTP ${upperMethod} ${new URL(url).host} — Status: ${response.status}`);

  if (response.status >= 400) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data).slice(0,200)}`);
  }

  return {
    success:    true,
    status:     response.status,
    statusText: response.statusText,
    data:       response.data,
    headers:    response.headers,
    message:    `HTTP ${upperMethod} successful`,
  };
};

module.exports = { execute };
