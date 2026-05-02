const { v4: uuidv4 } = require("uuid");
const Workflow   = require("../models/Workflow");
const Trigger    = require("../models/Trigger");
const Action     = require("../models/Action");
const ExecutionLog = require("../models/ExecutionLog");
const ApiError   = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ── GET ALL WORKFLOWS ─────────────────────────────────────────
const getWorkflows = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Workflow.countDocuments(filter);
  const workflows = await Workflow.find(filter)
    .populate("trigger", "type webhook.url schedule.humanReadable")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return ApiResponse.paginated(res, workflows, {
    total, page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// ── CREATE WORKFLOW ───────────────────────────────────────────
const createWorkflow = asyncHandler(async (req, res) => {
  const { name, description, tags } = req.body;

  // Check plan limits
  const count = await Workflow.countDocuments({ userId: req.user._id });
  if (count >= req.user.limits.maxWorkflows) {
    throw ApiError.forbidden(`Plan limit reached: max ${req.user.limits.maxWorkflows} workflows`);
  }

  const workflow = await Workflow.create({
    userId: req.user._id,
    name, description, tags,
    status: "draft",
  });

  return ApiResponse.created(res, { workflow }, "Workflow created");
});

// ── GET SINGLE WORKFLOW ───────────────────────────────────────
const getWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOne({
    _id: req.params.id, userId: req.user._id,
  })
  .populate("trigger")
  .populate({ path: "actions.actionId", model: "Action" });

  if (!workflow) throw ApiError.notFound("Workflow not found");

  return ApiResponse.success(res, { workflow });
});

// ── UPDATE WORKFLOW ───────────────────────────────────────────
const updateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!workflow) throw ApiError.notFound("Workflow not found");
  return ApiResponse.success(res, { workflow }, "Workflow updated");
});

// ── DELETE WORKFLOW ───────────────────────────────────────────
const deleteWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  // Delete related data
  await Trigger.deleteMany({ workflowId: workflow._id });
  await Action.deleteMany({ workflowId: workflow._id });
  await workflow.deleteOne();

  return ApiResponse.success(res, null, "Workflow deleted");
});

// ── ACTIVATE WORKFLOW ─────────────────────────────────────────
const activateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  const trigger = await Trigger.findOne({ workflowId: workflow._id });
  if (!trigger) throw ApiError.badRequest("Add a trigger before activating");

  workflow.status = "active";
  await workflow.save();

  return ApiResponse.success(res, { workflow }, "Workflow activated");
});

// ── PAUSE WORKFLOW ────────────────────────────────────────────
const pauseWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { status: "paused" },
    { new: true }
  );
  if (!workflow) throw ApiError.notFound("Workflow not found");
  return ApiResponse.success(res, { workflow }, "Workflow paused");
});

// ── MANUAL RUN ────────────────────────────────────────────────
const runWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");
  if (workflow.status !== "active") throw ApiError.badRequest("Workflow must be active to run");

  // Create execution log
  const log = await ExecutionLog.create({
    workflowId:  workflow._id,
    userId:      req.user._id,
    status:      "running",
    triggerType: "manual",
    triggerData: req.body || {},
    startedAt:   new Date(),
  });

  // TODO: Queue me daalo — Week 2 mein
  // For now just mark as success
  log.status      = "success";
  log.completedAt = new Date();
  log.duration    = 0;
  await log.save();

  workflow.stats.totalRuns++;
  workflow.stats.successRuns++;
  workflow.stats.lastRunAt = new Date();
  await workflow.save();

  return ApiResponse.success(res, { logId: log._id }, "Workflow triggered manually");
});

// ── DUPLICATE WORKFLOW ────────────────────────────────────────
const duplicateWorkflow = asyncHandler(async (req, res) => {
  const original = await Workflow.findOne({ _id: req.params.id, userId: req.user._id });
  if (!original) throw ApiError.notFound("Workflow not found");

  const count = await Workflow.countDocuments({ userId: req.user._id });
  if (count >= req.user.limits.maxWorkflows) {
    throw ApiError.forbidden(`Plan limit reached: max ${req.user.limits.maxWorkflows} workflows`);
  }

  const copy = await Workflow.create({
    userId:      req.user._id,
    name:        `${original.name} (Copy)`,
    description: original.description,
    tags:        original.tags,
    status:      "draft",
  });

  return ApiResponse.created(res, { workflow: copy }, "Workflow duplicated");
});

// ── GET WORKFLOW LOGS ─────────────────────────────────────────
const getWorkflowLogs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  const filter = { workflowId: workflow._id };
  if (status) filter.status = status;

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await ExecutionLog.countDocuments(filter);
  const logs  = await ExecutionLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return ApiResponse.paginated(res, logs, {
    total, page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// ── GET WORKFLOW STATS ────────────────────────────────────────
const getWorkflowStats = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workflow) throw ApiError.notFound("Workflow not found");

  const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentLogs = await ExecutionLog.find({
    workflowId: workflow._id,
    createdAt: { $gte: last7days },
  }).select("status createdAt duration");

  const successRate = workflow.stats.totalRuns > 0
    ? Math.round((workflow.stats.successRuns / workflow.stats.totalRuns) * 100)
    : 0;

  return ApiResponse.success(res, {
    stats: { ...workflow.stats.toObject(), successRate },
    recentLogs,
  });
});

module.exports = {
  getWorkflows, createWorkflow, getWorkflow,
  updateWorkflow, deleteWorkflow,
  activateWorkflow, pauseWorkflow,
  runWorkflow, duplicateWorkflow,
  getWorkflowLogs, getWorkflowStats,
};
