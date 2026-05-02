const Joi = require("joi");

const createWorkflowSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow("").default(""),
  tags:        Joi.array().items(Joi.string()).default([]),
});

const updateWorkflowSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow(""),
  tags:        Joi.array().items(Joi.string()),
  status:      Joi.string().valid("active","paused","draft"),
});

const createTriggerSchema = Joi.object({
  workflowId: Joi.string().required(),
  type:       Joi.string().valid("webhook","schedule","manual","form").required(),
  webhook: Joi.object({
    secret:  Joi.string().allow(""),
    method:  Joi.string().valid("GET","POST","PUT","PATCH").default("POST"),
    service: Joi.string().allow(""),
    event:   Joi.string().allow(""),
  }),
  schedule: Joi.object({
    cronExpression: Joi.string().required(),
    timezone:       Joi.string().default("Asia/Kolkata"),
    humanReadable:  Joi.string().allow(""),
  }),
  form: Joi.object({
    fields: Joi.array().items(Joi.object({
      name:     Joi.string().required(),
      label:    Joi.string().required(),
      type:     Joi.string().valid("text","email","number","textarea","select").default("text"),
      required: Joi.boolean().default(false),
    })).default([]),
  }),
});

const updateTriggerSchema = Joi.object({
  webhook:  Joi.object(),
  schedule: Joi.object(),
  form:     Joi.object(),
});

module.exports = {
  createWorkflowSchema,
  updateWorkflowSchema,
  createTriggerSchema,
  updateTriggerSchema,
};
