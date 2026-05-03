const axios = require("axios");

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
    url, method,
    headers: { "Content-Type": "application/json", ...headers, ...authHeaders },
    timeout,
    validateStatus: null, // Don't throw on non-2xx
  };

  if (["POST","PUT","PATCH"].includes(method.toUpperCase())) {
    requestConfig.data = body;
  }

  const response = await axios(requestConfig);

  console.log(`✅ HTTP ${method} ${url} — Status: ${response.status}`);

  if (response.status >= 400) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data).slice(0,200)}`);
  }

  return {
    success:    true,
    status:     response.status,
    statusText: response.statusText,
    data:       response.data,
    headers:    response.headers,
    message:    `HTTP ${method} successful`,
  };
};

module.exports = { execute };
