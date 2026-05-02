const ExecutionLog  = require("../models/ExecutionLog");
const { addWorkflowJob } = require("./jobQueue");

// Retry a failed execution
const retryExecution = async (logId, userId) => {
  const log = await ExecutionLog.findOne({ _id: logId, userId });
  if (!log) throw new Error("Execution log not found");
  if (log.status !== "failed") throw new Error("Only failed executions can be retried");

  const job = await addWorkflowJob({
    workflowId:  log.workflowId.toString(),
    userId:      log.userId.toString(),
    triggerData: log.triggerData,
    triggerType: log.triggerType,
    logId:       log._id.toString(),
    isRetry:     true,
  });

  // Mark original as retry-queued
  log.retryCount++;
  await log.save();

  return job;
};

module.exports = { retryExecution };
