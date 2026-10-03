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

// ── Header-injection protection ───────────────────────────────
// Values can come from webhook payloads ({{trigger.x}}), so treat them as attacker-controlled.
const assertNoCtl = (name, value) => {
  const s = String(value ?? "");
  if (/[\r\n\0\u2028\u2029]/.test(s)) throw new Error(`Gmail: invalid characters in '${name}'`);
  return s.trim();
};

const ADDR_RE = /^(?:[^<>\r\n"]*<)?([^\s<>@,;"]+@[^\s<>@,;"]+\.[^\s<>@,;"]+)>?$/;
const parseAddressList = (name, value) => {
  const raw = assertNoCtl(name, value);
  const out = raw.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = ADDR_RE.exec(p);
    if (!m) throw new Error(`Gmail: invalid email address in '${name}'`);
    return m[1];
  });
  if (out.length === 0 || out.length > 50) throw new Error(`Gmail: '${name}' must have 1-50 addresses`);
  return out;
};

// RFC 2047 encoded-words (<=75 chars each) for non-ASCII subjects
const encodeSubject = (subject) => {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  const words = [];
  let chunk = "";
  for (const ch of subject) {
    if (Buffer.byteLength(chunk + ch, "utf8") > 45) { words.push(chunk); chunk = ""; }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${Buffer.from(w, "utf8").toString("base64")}?=`).join("\r\n ");
};

const sendEmail = async (config, credentials, credentialId) => {
  const { to, subject, body, isHtml = true, cc, bcc } = config;
  if (!to)      throw new Error("Gmail: 'to' is required");
  if (!subject) throw new Error("Gmail: 'subject' is required");

  const toList  = parseAddressList("to", to);
  const ccList  = cc  ? parseAddressList("cc",  cc)  : null;
  const bccList = bcc ? parseAddressList("bcc", bcc) : null;
  const subj    = assertNoCtl("subject", subject);
  const html    = isHtml !== false && isHtml !== "false";

  let from = "me";
  if (credentials.email) { try { from = parseAddressList("from", credentials.email)[0]; } catch { from = "me"; } }

  const gmail = await getGmailClient(credentials, credentialId);

  // Build RFC 2822 email
  const bodyB64 = Buffer.from(String(body || ""), "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n");
  const lines = [
    `From: ${from}`,
    `To: ${toList.join(", ")}`,
    ccList  ? `Cc: ${ccList.join(", ")}`   : null,
    bccList ? `Bcc: ${bccList.join(", ")}` : null,
    `Subject: ${encodeSubject(subj)}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${html ? "text/html" : "text/plain"}; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    "",
    bodyB64,
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

module.exports = { execute, parseAddressList, encodeSubject };
