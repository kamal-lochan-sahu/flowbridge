const axios = require("axios");

const execute = async (actionType, config, credentials) => {
  switch (actionType) {
    case "send_message": return await sendMessage(config, credentials);
    default: throw new Error(`Unknown Slack action: ${actionType}`);
  }
};

const sendMessage = async (config, credentials) => {
  const { channel = "#general", message, username = "FlowBridge", icon_emoji = ":zap:" } = config;
  if (!message) throw new Error("Slack: 'message' is required");

  const token = credentials?.api_key || credentials?.bot_token;
  if (!token) throw new Error("Slack: bot token required");

  const response = await axios.post("https://slack.com/api/chat.postMessage", {
    channel, text: message, username, icon_emoji,
  }, {
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.data.ok) throw new Error(`Slack error: ${response.data.error}`);

  console.log(`✅ Slack message sent — Channel: ${channel}`);
  return {
    success: true,
    channel,
    ts:      response.data.ts,
    message: "Slack message sent",
  };
};

module.exports = { execute };
