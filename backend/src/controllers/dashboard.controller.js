const Workflow     = require("../models/Workflow");
const ExecutionLog = require("../models/ExecutionLog");
const ApiResponse  = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ── DASHBOARD STATS ───────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId  = req.user._id;
  const today   = new Date(); today.setHours(0,0,0,0);
  const week    = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const month   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalWorkflows, activeWorkflows,
    runsToday, runsWeek, runsMonth,
    successToday, failedToday,
  ] = await Promise.all([
    Workflow.countDocuments({ userId }),
    Workflow.countDocuments({ userId, status: "active" }),
    ExecutionLog.countDocuments({ userId, createdAt: { $gte: today } }),
    ExecutionLog.countDocuments({ userId, createdAt: { $gte: week } }),
    ExecutionLog.countDocuments({ userId, createdAt: { $gte: month } }),
    ExecutionLog.countDocuments({ userId, status: "success", createdAt: { $gte: today } }),
    ExecutionLog.countDocuments({ userId, status: "failed",  createdAt: { $gte: today } }),
  ]);

  const successRate = runsToday > 0 ? Math.round((successToday / runsToday) * 100) : 0;

  // Most active workflow
  const mostActive = await Workflow.findOne({ userId })
    .sort({ "stats.totalRuns": -1 })
    .select("name stats.totalRuns stats.successRuns");

  return ApiResponse.success(res, {
    totalWorkflows, activeWorkflows,
    runs: { today: runsToday, week: runsWeek, month: runsMonth },
    successRate,
    successToday, failedToday,
    mostActive,
  });
});

// ── RUN CHART (7 days) ────────────────────────────────────────
const getRunChart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const days   = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate() - i);
    const end   = new Date(start); end.setDate(end.getDate() + 1);

    const [success, failed] = await Promise.all([
      ExecutionLog.countDocuments({ userId, status: "success", createdAt: { $gte: start, $lt: end } }),
      ExecutionLog.countDocuments({ userId, status: "failed",  createdAt: { $gte: start, $lt: end } }),
    ]);

    days.push({
      date:    start.toISOString().split("T")[0],
      day:     start.toLocaleDateString("en-IN", { weekday: "short" }),
      success, failed,
      total:   success + failed,
    });
  }

  return ApiResponse.success(res, { chart: days });
});

// ── RECENT ACTIVITY ───────────────────────────────────────────
const getRecentActivity = asyncHandler(async (req, res) => {
  const logs = await ExecutionLog.find({ userId: req.user._id })
    .populate("workflowId", "name")
    .sort({ createdAt: -1 })
    .limit(10)
    .select("status triggerType duration createdAt workflowId error");

  return ApiResponse.success(res, { activity: logs });
});

module.exports = { getDashboardStats, getRunChart, getRecentActivity };
