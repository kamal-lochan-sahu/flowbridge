const { getAuthUrl, getTokensFromCode } = require("../../config/google");

const getGmailAuthUrl = (state) => getAuthUrl("gmail", state);
const getGmailTokens  = (code)  => getTokensFromCode(code);

module.exports = { getGmailAuthUrl, getGmailTokens };
