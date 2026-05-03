const twilio = require("twilio");

const getClient = (credentials) => {
  if (!credentials?.account_sid || !credentials?.auth_token) {
    throw new Error("Twilio: account_sid and auth_token required");
  }
  return twilio(credentials.account_sid, credentials.auth_token);
};

const execute = async (actionType, config, credentials) => {
  switch (actionType) {
    case "send_sms":       return await sendSMS(config, credentials);
    case "send_whatsapp":  return await sendWhatsApp(config, credentials);
    default: throw new Error(`Unknown Twilio action: ${actionType}`);
  }
};

const sendSMS = async (config, credentials) => {
  const { to, message } = config;
  if (!to)      throw new Error("Twilio SMS: 'to' is required");
  if (!message) throw new Error("Twilio SMS: 'message' is required");

  const from   = credentials.phone || process.env.TWILIO_PHONE;
  if (!from) throw new Error("Twilio: sender phone not configured");

  const client = getClient(credentials);
  const result = await client.messages.create({ body: message, from, to });

  console.log(`✅ SMS sent — SID: ${result.sid}`);
  return {
    success: true,
    sid:     result.sid,
    status:  result.status,
    to, message,
    message: "SMS sent successfully",
  };
};

const sendWhatsApp = async (config, credentials) => {
  const { to, message } = config;
  if (!to)      throw new Error("Twilio WhatsApp: 'to' is required");
  if (!message) throw new Error("Twilio WhatsApp: 'message' is required");

  const from   = credentials.whatsapp_from ||
                 process.env.TWILIO_WHATSAPP_FROM ||
                 "whatsapp:+14155238886";

  const toWA   = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const client = getClient(credentials);

  const result = await client.messages.create({
    body: message,
    from,
    to:   toWA,
  });

  console.log(`✅ WhatsApp sent — SID: ${result.sid}`);
  return {
    success: true,
    sid:     result.sid,
    status:  result.status,
    to: toWA, message,
    message: "WhatsApp message sent successfully",
  };
};

module.exports = { execute };
