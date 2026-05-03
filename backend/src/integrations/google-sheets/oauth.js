const { getAuthUrl, getTokensFromCode } = require("../../config/google");

const getSheetsAuthUrl = (state) => getAuthUrl("sheets", state);
const getSheetsTokens  = (code)  => getTokensFromCode(code);

module.exports = { getSheetsAuthUrl, getSheetsTokens };
