const Action    = require("../models/Action");
const Workflow  = require("../models/Workflow");
const ApiError  = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Action config templates — what fields each service needs
const ACTION_TEMPLATES = {
  gmail: {
    send_email: {
      to:      "{{trigger.email}}",
      subject: "Hello {{trigger.name}}",
      body:    "<p>Dear {{trigger.name}},</p><p>Your message here.</p>",
      isHtml:  true,
    },
  },
  "google-sheets": {
    append_row: { sheetId: "", sheetName: "Sheet1", mapping: {} },
    read_row:   { sheetId: "", sheetName: "Sheet1", range: "A1:Z1" },
    update_row: { sheetId: "", sheetName: "Sheet1", rowIndex: 1, mapping: {} },
  },
  "pdf-generator": {
    generate_pdf: { template: "invoice", variables: {}, outputName: "document.pdf", saveToEmail: false },
  },
  twilio: {
    send_sms:       { to: "{{trigger.phone}}", message: "Hello {{trigger.name}}" },
    send_whatsapp:  { to: "{{trigger.phone}}", message: "Hello {{trigger.name}}" },
  },
  "http-request": {
    request: { url: "", method: "POST", headers: {}, body: {}, authType: "none" },
  },
  slack: {
    send_message: { channel: "#general", message: "{{trigger.message}}", username: "FlowBridge" },
  },
  mongodb: {
    insert_document: { collection: "", document: {} },
    update_document: { collection: "", filter: {}, update: {} },
    find_document:   { collection: "", filter: {} },
  },
  filter: {
    condition: {
      field:    "{{trigger.amount}}",
      operator: "greater_than",
      value:    "0",
      onFalse:  "stop",
    },
  },
  delay: {
    wait: { duration: 5, unit: "minutes" },
  },
};

// ── CREATE ACTION ─────────────────────────────────────────────
const createAction = asyncHandler(async (req, res) => {
  const { workflowId, order, service, actionType, config, credentialId, retry } = req.body;

  const workflow = await Workflow.findOne({ _id: workflowId, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  // Merge provided config with template defaults
  const template = ACTION_TEMPLATES[service]?.[actionType] || {};
  const mergedConfig = { ...template, ...config };

  const action = await Action.create({
    workflowId, userId: req.user._id,
    order, service, actionType,
    config: mergedConfig,
    credentialId: credentialId || null,
    retry,
  });

  // Add to workflow actions array
  workflow.actions.push({ order, actionId: action._id });
  workflow.actions.sort((a, b) => a.order - b.order);
  await workflow.save({ validateBeforeSave: false });

  return ApiResponse.created(res, { action }, "Action created");
});

// ── GET WORKFLOW ACTIONS ──────────────────────────────────────
const getWorkflowActions = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  const actions = await Action.find({ workflowId: req.params.id })
    .sort({ order: 1 });

  return ApiResponse.success(res, { actions });
});

// ── UPDATE ACTION ─────────────────────────────────────────────
const updateAction = asyncHandler(async (req, res) => {
  const action = await Action.findOne({ _id: req.params.id, userId: req.user._id });
  if (!action) throw ApiError.notFound("Action not found");

  const { config, credentialId, retry, order } = req.body;

  if (config)       action.config       = { ...action.config, ...config };
  if (credentialId !== undefined) action.credentialId = credentialId;
  if (retry)        action.retry        = { ...action.retry.toObject(), ...retry };
  if (order)        action.order        = order;

  await action.save();
  return ApiResponse.success(res, { action }, "Action updated");
});

// ── DELETE ACTION ─────────────────────────────────────────────
const deleteAction = asyncHandler(async (req, res) => {
  const action = await Action.findOne({ _id: req.params.id, userId: req.user._id });
  if (!action) throw ApiError.notFound("Action not found");

  // Remove from workflow actions array
  await Workflow.findByIdAndUpdate(action.workflowId, {
    $pull: { actions: { actionId: action._id } },
  });

  await action.deleteOne();
  return ApiResponse.success(res, null, "Action deleted");
});

// ── REORDER ACTIONS ───────────────────────────────────────────
const reorderActions = asyncHandler(async (req, res) => {
  const { workflowId, actions } = req.body;

  const workflow = await Workflow.findOne({ _id: workflowId, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  // Update order for each action
  const updates = actions.map(({ actionId, order }) =>
    Action.findOneAndUpdate(
      { _id: actionId, workflowId, userId: req.user._id },
      { order },
      { new: true }
    )
  );
  await Promise.all(updates);

  // Sync workflow actions array
  workflow.actions = actions.map(({ actionId, order }) => ({ actionId, order }));
  await workflow.save({ validateBeforeSave: false });

  return ApiResponse.success(res, null, "Actions reordered");
});

// ── TEST ACTION ───────────────────────────────────────────────
const testAction = asyncHandler(async (req, res) => {
  const action = await Action.findOne({ _id: req.params.id, userId: req.user._id });
  if (!action) throw ApiError.notFound("Action not found");

  // Sample test data per service
  const testResults = {
    gmail:           { message: "Email action configured", to: action.config.to, subject: action.config.subject },
    "google-sheets": { message: "Sheets action configured", sheetId: action.config.sheetId },
    "pdf-generator": { message: "PDF action configured", template: action.config.template },
    twilio:          { message: "Twilio action configured", to: action.config.to },
    "http-request":  { message: "HTTP action configured", url: action.config.url, method: action.config.method },
    slack:           { message: "Slack action configured", channel: action.config.channel },
    mongodb:         { message: "MongoDB action configured", collection: action.config.collection },
    filter:          { message: "Filter action configured", field: action.config.field, operator: action.config.operator },
    delay:           { message: "Delay action configured", duration: `${action.config.duration} ${action.config.unit}` },
  };

  return ApiResponse.success(res, {
    service:    action.service,
    actionType: action.actionType,
    config:     action.config,
    testResult: testResults[action.service] || { message: "Action configured" },
  }, "Action test successful");
});

// ── GET ACTION TEMPLATES ──────────────────────────────────────
const getActionTemplates = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { templates: ACTION_TEMPLATES });
});

module.exports = {
  createAction, getWorkflowActions, updateAction,
  deleteAction, reorderActions, testAction, getActionTemplates,
};
