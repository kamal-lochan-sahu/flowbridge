const Joi = require("joi");

const createActionSchema = Joi.object({
  workflowId: Joi.string().required(),
  order:      Joi.number().integer().min(1).required(),
  service:    Joi.string().valid(
    "gmail","google-sheets","pdf-generator","twilio",
    "http-request","slack","mongodb","filter","delay"
  ).required(),
  actionType:   Joi.string().required(),
  config:       Joi.object().default({}),
  credentialId: Joi.string().allow(null,"").default(null),
  retry: Joi.object({
    enabled:     Joi.boolean().default(true),
    maxAttempts: Joi.number().integer().min(1).max(5).default(3),
    intervals:   Joi.array().items(Joi.number()).default([1,5,15]),
  }).default({ enabled: true, maxAttempts: 3, intervals: [1,5,15] }),
});

const updateActionSchema = Joi.object({
  order:        Joi.number().integer().min(1),
  config:       Joi.object(),
  credentialId: Joi.string().allow(null,""),
  retry:        Joi.object({
    enabled:     Joi.boolean(),
    maxAttempts: Joi.number().integer().min(1).max(5),
    intervals:   Joi.array().items(Joi.number()),
  }),
});

const reorderActionsSchema = Joi.object({
  workflowId: Joi.string().required(),
  actions:    Joi.array().items(Joi.object({
    actionId: Joi.string().required(),
    order:    Joi.number().integer().min(1).required(),
  })).required(),
});

module.exports = { createActionSchema, updateActionSchema, reorderActionsSchema };
