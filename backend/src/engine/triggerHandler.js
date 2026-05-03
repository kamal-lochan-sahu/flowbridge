const Workflow  = require("../models/Workflow");
const Trigger   = require("../models/Trigger");
const { addWorkflowJob } = require("../queue/jobQueue");

// Find workflow by webhook URL and queue it
const handleWebhookTrigger = async (webhookId, payload, headers) => {
  // Find trigger by webhook URL
  const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/receive/${webhookId}`;
  const trigger    = await Trigger.findOne({ "webhook.url": webhookUrl });

  if (!trigger) throw new Error(`No trigger found for webhook: ${webhookId}`);

  // Find associated workflow
  const workflow = await Workflow.findOne({
    _id:    trigger.workflowId,
    status: "active",
  });

  if (!workflow) throw new Error(`Workflow not active for webhook: ${webhookId}`);

  // Save last payload to trigger
  trigger.lastPayload = payload;
  await trigger.save();

  // Add to job queue
  const job = await addWorkflowJob({
    workflowId:  workflow._id.toString(),
    userId:      workflow.userId.toString(),
    triggerData: payload,
    triggerType: "webhook",
    webhookId,
  });

  return {
    jobId:      job.id,
    workflowId: workflow._id,
    message:    "Webhook received — workflow queued",
  };
};

// Handle manual trigger
const handleManualTrigger = async (workflowId, userId, payload = {}) => {
  const workflow = await Workflow.findOne({ _id: workflowId, userId, status: "active" });
  if (!workflow) throw new Error("Workflow not found or not active");

  const job = await addWorkflowJob({
    workflowId:  workflow._id.toString(),
    userId:      userId.toString(),
    triggerData: payload,
    triggerType: "manual",
  });

  return { jobId: job.id, workflowId, message: "Manual trigger queued" };
};

// Handle schedule trigger
const handleScheduleTrigger = async (workflowId, userId) => {
  const workflow = await Workflow.findOne({ _id: workflowId, userId, status: "active" });
  if (!workflow) return null;

  const job = await addWorkflowJob({
    workflowId:  workflow._id.toString(),
    userId:      userId.toString(),
    triggerData: { triggeredAt: new Date().toISOString(), type: "schedule" },
    triggerType: "schedule",
  });

  return { jobId: job.id, workflowId };
};

module.exports = { handleWebhookTrigger, handleManualTrigger, handleScheduleTrigger };
