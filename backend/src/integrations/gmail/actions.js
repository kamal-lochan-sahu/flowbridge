const { google }  = require("googleapis");
const { getAuthenticatedClient, refreshAccessToken } = require("../../config/google");
const Credential = require("../../models/Credential");
const { encryptCredentials } = require("../../config/encryption");

const getGmailClient = async (credentials, credentialId) => {
  let tokens = {
    access_token:  credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date:   credentials.token_expiry,
  };

  // Auto-refresh if expired
  if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60000) {
    console.log("🔄 Gmail token expired — refreshing...");
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    tokens = { ...tokens, ...newTokens };

    // Save new tokens to DB
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
  return google.gmail({ version: "v1", auth });
};

const execute = async (actionType, config, credentials, credentialId) => {
  if (!credentials) throw new Error("Gmail credentials required");

  switch (actionType) {
    case "send_email": return await sendEmail(config, credentials, credentialId);
    default: throw new Error(`Unknown Gmail action: ${actionType}`);
  }
};

const sendEmail = async (config, credentials, credentialId) => {
  const { to, subject, body, isHtml = true, cc, bcc } = config;
  if (!to)      throw new Error("Gmail: 'to' is required");
  if (!subject) throw new Error("Gmail: 'subject' is required");

  const gmail = await getGmailClient(credentials, credentialId);

  // Build RFC 2822 email
  const lines = [
    `From: ${credentials.email || "me"}`,
    `To: ${to}`,
    cc  ? `Cc: ${cc}`   : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=utf-8`,
    "",
    body || "",
  ].filter(l => l !== null).join("\r\n");

  const encoded = Buffer.from(lines)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  console.log(`✅ Gmail sent — MessageId: ${result.data.id}`);
  return {
    success:   true,
    messageId: result.data.id,
    to, subject,
    message:   "Email sent successfully",
  };
};

module.exports = { execute };
