const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const Trigger    = require("../models/Trigger");
const Workflow   = require("../models/Workflow");
const ApiError   = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const WEBHOOK_BASE = process.env.WEBHOOK_BASE_URL || "http://localhost:5000";

// ── CREATE TRIGGER ────────────────────────────────────────────
const createTrigger = asyncHandler(async (req, res) => {
  const { workflowId, type, webhook, schedule, form } = req.body;

  const workflow = await Workflow.findOne({ _id: workflowId, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  // Delete existing trigger if any
  await Trigger.deleteOne({ workflowId });

  const triggerData = { workflowId, userId: req.user._id, type };

  if (type === "webhook") {
    const webhookId = uuidv4();
    triggerData.webhook = {
      url:     `${WEBHOOK_BASE}/api/webhooks/receive/${webhookId}`,
      secret:  webhook?.secret || crypto.randomBytes(24).toString("hex"),
      method:  webhook?.method || "POST",
      service: webhook?.service || "",
      event:   webhook?.event || "",
    };
  }

  if (type === "schedule") {
    if (!schedule?.cronExpression) throw ApiError.badRequest("cronExpression required for schedule trigger");
    triggerData.schedule = {
      cronExpression: schedule.cronExpression,
      timezone:       schedule.timezone || "Asia/Kolkata",
      humanReadable:  schedule.humanReadable || schedule.cronExpression,
    };
  }

  if (type === "form") {
    const formId = uuidv4();
    triggerData.form = {
      fields:    form?.fields || [],
      embedCode: `<script src="${WEBHOOK_BASE}/form.js" data-form-id="${formId}"></script>`,
    };
  }

  const trigger = await Trigger.create(triggerData);

  // Link trigger to workflow
  workflow.trigger = trigger._id;
  await workflow.save({ validateBeforeSave: false });

  return ApiResponse.created(res, { trigger }, "Trigger created");
});

// ── GET TRIGGER ───────────────────────────────────────────────
const getTrigger = asyncHandler(async (req, res) => {
  const trigger = await Trigger.findOne({
    _id: req.params.id, userId: req.user._id,
  });
  if (!trigger) throw ApiError.notFound("Trigger not found");
  return ApiResponse.success(res, { trigger });
});

// ── UPDATE TRIGGER ────────────────────────────────────────────
const updateTrigger = asyncHandler(async (req, res) => {
  const trigger = await Trigger.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trigger) throw ApiError.notFound("Trigger not found");

  const { webhook, schedule, form } = req.body;

  if (webhook  && trigger.type === "webhook") {
    // whitelist — never let the client overwrite webhook.url (would hijack another trigger's URL)
    for (const k of ["secret", "method", "service", "event"]) {
      if (webhook[k] !== undefined) trigger.webhook[k] = webhook[k];
    }
  }
  if (schedule && trigger.type === "schedule") Object.assign(trigger.schedule, schedule);
  if (form     && trigger.type === "form")     Object.assign(trigger.form,     form);

  await trigger.save();
  return ApiResponse.success(res, { trigger }, "Trigger updated");
});

// ── TEST TRIGGER ──────────────────────────────────────────────
const testTrigger = asyncHandler(async (req, res) => {
  const trigger = await Trigger.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trigger) throw ApiError.notFound("Trigger not found");

  const sampleData = {
    webhook:  { message: "Webhook trigger ready", url: trigger.webhook?.url },
    schedule: { message: "Schedule trigger ready", cron: trigger.schedule?.cronExpression },
    manual:   { message: "Manual trigger ready" },
    form:     { message: "Form trigger ready", fields: trigger.form?.fields },
  };

  return ApiResponse.success(res, {
    type:   trigger.type,
    config: sampleData[trigger.type] || {},
  }, "Trigger test successful");
});

module.exports = { createTrigger, getTrigger, updateTrigger, testTrigger };
