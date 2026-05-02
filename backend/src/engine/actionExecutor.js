const Credential = require("../models/Credential");
const { decryptCredentials } = require("../config/encryption");

// Execute a single action
const executeAction = async (action, resolvedConfig, userId) => {
  const { service, actionType, credentialId } = action;

  // Get credentials if needed
  let credentials = null;
  if (credentialId) {
    const cred = await Credential.findOne({ _id: credentialId, userId });
    if (!cred) throw new Error(`Credential not found: ${credentialId}`);
    credentials = decryptCredentials(cred.credentials);
  }

  console.log(`   ▶️  Executing: ${service}/${actionType}`);

  switch (service) {
    case "gmail":
      return await require("../integrations/gmail/actions").execute(actionType, resolvedConfig, credentials);

    case "google-sheets":
      return await require("../integrations/google-sheets/actions").execute(actionType, resolvedConfig, credentials);

    case "twilio":
      return await require("../integrations/twilio/actions").execute(actionType, resolvedConfig, credentials);

    case "pdf-generator":
      return await require("../integrations/pdf-generator/index").execute(actionType, resolvedConfig, credentials);

    case "http-request":
      return await require("../integrations/http-request/index").execute(actionType, resolvedConfig, credentials);

    case "slack":
      return await require("../integrations/slack/actions").execute(actionType, resolvedConfig, credentials);

    case "mongodb":
      return await require("../integrations/mongodb-action/actions").execute(actionType, resolvedConfig, credentials);

    default:
      throw new Error(`Unknown service: ${service}`);
  }
};

module.exports = { executeAction };
