const ExecutionLog  = require("../models/ExecutionLog");
const ExecutionStep = require("../models/ExecutionStep");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const asyncHandler  = require("../utils/asyncHandler");
const { retryExecution } = require("../queue/retryHandler");

// ── GET ALL LOGS ──────────────────────────────────────────────
const getLogs = asyncHandler(async (req, res) => {
  const { workflowId, status, from, to, page = 1, limit = 20 } = req.query;

  const filter = { userId: req.user._id };
  if (workflowId) filter.workflowId = workflowId;
  if (status)     filter.status     = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to);
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await ExecutionLog.countDocuments(filter);
  const logs  = await ExecutionLog.find(filter)
    .populate("workflowId", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return ApiResponse.paginated(res, logs, {
    total, page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// ── GET LOG DETAIL ────────────────────────────────────────────
const getLog = asyncHandler(async (req, res) => {
  const log = await ExecutionLog.findOne({ _id: req.params.id, userId: req.user._id })
    .populate("workflowId", "name status");
  if (!log) throw ApiError.notFound("Log not found");
  return ApiResponse.success(res, { log });
});

// ── GET LOG STEPS ─────────────────────────────────────────────
const getLogSteps = asyncHandler(async (req, res) => {
  const log = await ExecutionLog.findOne({ _id: req.params.id, userId: req.user._id });
  if (!log) throw ApiError.notFound("Log not found");

  const steps = await ExecutionStep.find({ logId: log._id }).sort({ order: 1 });
  return ApiResponse.success(res, { steps, log });
});

// ── RETRY FAILED LOG ──────────────────────────────────────────
const retryLog = asyncHandler(async (req, res) => {
  const job = await retryExecution(req.params.id, req.user._id);
  return ApiResponse.success(res, { jobId: job.id }, "Retry queued successfully");
});

// ── CLEAR OLD LOGS ────────────────────────────────────────────
const clearLogs = asyncHandler(async (req, res) => {
  const { olderThan = 30 } = req.query;
  const cutoff = new Date(Date.now() - parseInt(olderThan) * 24 * 60 * 60 * 1000);

  const result = await ExecutionLog.deleteMany({
    userId:    req.user._id,
    createdAt: { $lt: cutoff },
  });

  return ApiResponse.success(res, { deleted: result.deletedCount },
    `${result.deletedCount} logs cleared`);
});

module.exports = { getLogs, getLog, getLogSteps, retryLog, clearLogs };
