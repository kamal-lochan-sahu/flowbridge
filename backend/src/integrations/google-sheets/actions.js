const { google } = require("googleapis");
const { getAuthenticatedClient, refreshAccessToken } = require("../../config/google");
const Credential = require("../../models/Credential");
const { encryptCredentials } = require("../../config/encryption");

const getSheetsClient = async (credentials, credentialId) => {
  let tokens = {
    access_token:  credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date:   credentials.token_expiry,
  };

  if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60000) {
    console.log("🔄 Sheets token expired — refreshing...");
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    tokens = { ...tokens, ...newTokens };
    if (credentialId) {
      await Credential.findByIdAndUpdate(credentialId, {
        credentials: encryptCredentials({
          ...credentials,
          access_token: newTokens.access_token,
          token_expiry: newTokens.expiry_date,
        }),
      });
    }
  }

  const auth = getAuthenticatedClient(tokens);
  return google.sheets({ version: "v4", auth });
};

const execute = async (actionType, config, credentials, credentialId) => {
  if (!credentials) throw new Error("Google Sheets credentials required");

  switch (actionType) {
    case "append_row": return await appendRow(config, credentials, credentialId);
    case "read_row":   return await readRows(config, credentials, credentialId);
    case "update_row": return await updateRow(config, credentials, credentialId);
    default: throw new Error(`Unknown Sheets action: ${actionType}`);
  }
};

const appendRow = async (config, credentials, credentialId) => {
  const { sheetId, sheetName = "Sheet1", mapping = {} } = config;
  if (!sheetId) throw new Error("Sheets: 'sheetId' is required");

  const sheets = await getSheetsClient(credentials, credentialId);
  const values  = Object.values(mapping).length > 0
    ? [Object.values(mapping)]
    : [Object.keys(mapping)];

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId:     sheetId,
    range:             `${sheetName}!A1`,
    valueInputOption:  "USER_ENTERED",
    insertDataOption:  "INSERT_ROWS",
    requestBody:       { values },
  });

  console.log(`✅ Sheets row appended — ${result.data.updates?.updatedRange}`);
  return {
    success:      true,
    updatedRange: result.data.updates?.updatedRange,
    updatedRows:  result.data.updates?.updatedRows,
    message:      "Row appended to sheet",
  };
};

const readRows = async (config, credentials, credentialId) => {
  const { sheetId, sheetName = "Sheet1", range = "A1:Z100" } = config;
  if (!sheetId) throw new Error("Sheets: 'sheetId' is required");

  const sheets  = await getSheetsClient(credentials, credentialId);
  const result  = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range:         `${sheetName}!${range}`,
  });

  const rows = result.data.values || [];
  console.log(`✅ Sheets read — ${rows.length} rows`);
  return { success: true, rows, count: rows.length, message: `${rows.length} rows read` };
};

const updateRow = async (config, credentials, credentialId) => {
  const { sheetId, sheetName = "Sheet1", range, mapping = {} } = config;
  if (!sheetId) throw new Error("Sheets: 'sheetId' is required");
  if (!range)   throw new Error("Sheets: 'range' is required for update");

  const sheets = await getSheetsClient(credentials, credentialId);
  const values  = [Object.values(mapping)];

  const result = await sheets.spreadsheets.values.update({
    spreadsheetId:    sheetId,
    range:            `${sheetName}!${range}`,
    valueInputOption: "USER_ENTERED",
    requestBody:      { values },
  });

  console.log(`✅ Sheets updated — ${result.data.updatedRange}`);
  return {
    success:      true,
    updatedRange: result.data.updatedRange,
    updatedCells: result.data.updatedCells,
    message:      "Sheet updated",
  };
};

module.exports = { execute };
