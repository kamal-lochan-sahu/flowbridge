const cron     = require("node-cron");
const Workflow = require("../models/Workflow");
const Trigger  = require("../models/Trigger");
const { handleScheduleTrigger } = require("../engine/triggerHandler");

const activeCrons = new Map(); // workflowId → cron task

// Start all active schedule triggers on server boot
const initScheduleTriggers = async () => {
  try {
    const triggers = await Trigger.find({ type: "schedule" })
      .populate({ path: "workflowId", match: { status: "active" } });

    let started = 0;
    for (const trigger of triggers) {
      if (!trigger.workflowId) continue; // Workflow not active
      if (!trigger.schedule?.cronExpression) continue;

      scheduleWorkflow(trigger);
      started++;
    }
    console.log(`✅ Schedule triggers initialized: ${started} active`);
  } catch (err) {
    console.error("❌ Schedule init error:", err.message);
  }
};

// Schedule a single workflow
const scheduleWorkflow = (trigger) => {
  const { cronExpression, timezone = "Asia/Kolkata" } = trigger.schedule;
  const workflowId = trigger.workflowId._id?.toString() || trigger.workflowId.toString();
  const userId     = trigger.userId.toString();

  // Stop existing cron if any
  stopWorkflowSchedule(workflowId);

  if (!cron.validate(cronExpression)) {
    console.warn(`⚠️  Invalid cron: ${cronExpression} for workflow ${workflowId}`);
    return;
  }

  const task = cron.schedule(cronExpression, async () => {
    console.log(`⏰ Schedule trigger — Workflow: ${workflowId}`);
    try {
      await handleScheduleTrigger(workflowId, userId);
    } catch (err) {
      console.error(`❌ Schedule trigger error:`, err.message);
    }
  }, {
    timezone,
    scheduled: true,
  });

  activeCrons.set(workflowId, task);
  console.log(`✅ Scheduled: ${workflowId} — ${cronExpression} (${timezone})`);
};

// Stop a workflow schedule
const stopWorkflowSchedule = (workflowId) => {
  const existing = activeCrons.get(workflowId);
  if (existing) {
    existing.stop();
    activeCrons.delete(workflowId);
    console.log(`⏹️  Schedule stopped: ${workflowId}`);
  }
};

// Reload after workflow activate/pause
const reloadWorkflowSchedule = async (workflowId) => {
  const trigger = await Trigger.findOne({ workflowId, type: "schedule" })
    .populate("workflowId");

  if (!trigger || !trigger.workflowId) {
    stopWorkflowSchedule(workflowId);
    return;
  }

  if (trigger.workflowId.status === "active") {
    scheduleWorkflow(trigger);
  } else {
    stopWorkflowSchedule(workflowId);
  }
};

const getActiveSchedules = () => {
  return Array.from(activeCrons.keys());
};

module.exports = {
  initScheduleTriggers,
  scheduleWorkflow,
  stopWorkflowSchedule,
  reloadWorkflowSchedule,
  getActiveSchedules,
};
