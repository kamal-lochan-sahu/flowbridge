const Joi = require("joi");

const createCredentialSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).required(),
  service:  Joi.string().valid(
    "gmail","google-sheets","twilio","shopify",
    "razorpay","stripe","slack","mongodb","custom"
  ).required(),
  authType: Joi.string().valid("oauth2","api_key","basic").required(),
  credentials: Joi.object().required(),
});

const updateCredentialSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100),
  credentials: Joi.object(),
});

module.exports = { createCredentialSchema, updateCredentialSchema };
