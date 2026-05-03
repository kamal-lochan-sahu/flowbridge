const User     = require("../models/User");
const Workflow = require("../models/Workflow");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ── GET SETTINGS ──────────────────────────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("User not found");
  return ApiResponse.success(res, {
    profile: {
      name:   user.name,
      email:  user.email,
      avatar: user.avatar,
      role:   user.role,
    },
    branding:      user.branding,
    notifications: user.notifications,
    limits:        user.limits,
    plan:          user.plan,
    logRetentionDays: user.logRetentionDays,
    webhookBaseUrl:   process.env.WEBHOOK_BASE_URL,
  });
});

// ── UPDATE PROFILE ────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, avatar } },
    { new: true, runValidators: true }
  );
  return ApiResponse.success(res, { user: user.toSafeObject() }, "Profile updated");
});

// ── UPDATE BRANDING ───────────────────────────────────────────
const updateBranding = asyncHandler(async (req, res) => {
  const { companyName, logo, primaryColor, domain } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { branding: { companyName, logo, primaryColor, domain } } },
    { new: true }
  );
  return ApiResponse.success(res, { branding: user.branding }, "Branding updated");
});

// ── UPDATE NOTIFICATIONS ──────────────────────────────────────
const updateNotifications = asyncHandler(async (req, res) => {
  const { emailOnFailure, dailySummary } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { notifications: { emailOnFailure, dailySummary } } },
    { new: true }
  );
  return ApiResponse.success(res, { notifications: user.notifications }, "Notification preferences updated");
});

// ── EXPORT WORKFLOWS ──────────────────────────────────────────
const exportWorkflows = asyncHandler(async (req, res) => {
  const workflows = await Workflow.find({ userId: req.user._id })
    .populate("trigger")
    .populate({ path: "actions.actionId", model: "Action" });

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId:     req.user._id,
    version:    "1.0",
    workflows:  workflows.map(w => ({
      name:        w.name,
      description: w.description,
      tags:        w.tags,
      trigger:     w.trigger,
      actions:     w.actions,
    })),
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=flowbridge-export-${Date.now()}.json`);
  return res.json(exportData);
});

// ── IMPORT WORKFLOWS ──────────────────────────────────────────
const importWorkflows = asyncHandler(async (req, res) => {
  const { workflows } = req.body;
  if (!Array.isArray(workflows)) throw ApiError.badRequest("Invalid import format");

  const imported = [];
  for (const wf of workflows) {
    const created = await Workflow.create({
      userId:      req.user._id,
      name:        `${wf.name} (Imported)`,
      description: wf.description || "",
      tags:        wf.tags || [],
      status:      "draft",
    });
    imported.push(created.name);
  }

  return ApiResponse.success(res, { imported, count: imported.length },
    `${imported.length} workflows imported`);
});

module.exports = {
  getSettings, updateProfile, updateBranding,
  updateNotifications, exportWorkflows, importWorkflows,
};
