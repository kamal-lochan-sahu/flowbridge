const { google } = require("googleapis");

const getOAuthClient = (redirect = null) => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirect || process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = {
  gmail:  ["https://www.googleapis.com/auth/gmail.send","https://www.googleapis.com/auth/gmail.readonly","https://www.googleapis.com/auth/userinfo.email"],
  sheets: ["https://www.googleapis.com/auth/spreadsheets","https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/userinfo.email"],
  full:   ["https://www.googleapis.com/auth/gmail.send","https://www.googleapis.com/auth/gmail.readonly","https://www.googleapis.com/auth/spreadsheets","https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/userinfo.email","https://www.googleapis.com/auth/userinfo.profile"],
};

const getAuthUrl = (scope = "full", state = "") =>
  getOAuthClient().generateAuthUrl({ access_type: "offline", scope: SCOPES[scope] || SCOPES.full, state, prompt: "consent" });

const getTokensFromCode    = async (code) => { const { tokens } = await getOAuthClient().getToken(code); return tokens; };
const refreshAccessToken   = async (rt)   => { const c = getOAuthClient(); c.setCredentials({ refresh_token: rt }); const { credentials } = await c.refreshAccessToken(); return credentials; };
const getAuthenticatedClient = (tokens)   => { const c = getOAuthClient(); c.setCredentials(tokens); return c; };

module.exports = { getOAuthClient, getAuthUrl, getTokensFromCode, refreshAccessToken, getAuthenticatedClient, SCOPES };
