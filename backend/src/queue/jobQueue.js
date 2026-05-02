const Bull  = require("bull");
const { getRedisClient } = require("../config/redis");

let workflowQueue = null;

const getQueue = () => {
  if (workflowQueue) return workflowQueue;

  const redisUrl = process.env.REDIS_URL;

  workflowQueue = new Bull("workflow-execution", redisUrl, {
    defaultJobOptions: {
      attempts:    3,
      backoff: {
        type:  "fixed",
        delay: 60000, // 1 min between retries
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail:     200, // Keep last 200 failed jobs
    },
    settings: {
      stalledInterval:    30000,
      maxStalledCount:    2,
      retryProcessDelay:  5000,
    },
  });

  workflowQueue.on("error",     (err) => console.error("❌ Queue error:", err.message));
  workflowQueue.on("waiting",   (id)  => console.log(`📋 Job ${id} waiting`));
  workflowQueue.on("active",    (job) => console.log(`⚡ Job ${job.id} started — Workflow: ${job.data.workflowId}`));
  workflowQueue.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
  workflowQueue.on("failed",    (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));
  workflowQueue.on("stalled",   (job) => console.warn(`⚠️  Job ${job} stalled`));

  console.log("✅ Workflow Queue initialized");
  return workflowQueue;
};

// Add job to queue
const addWorkflowJob = async (data, options = {}) => {
  const queue = getQueue();
  const job   = await queue.add(data, {
    priority: options.priority || 0,
    delay:    options.delay    || 0,
    ...options,
  });
  console.log(`📥 Job ${job.id} added — Workflow: ${data.workflowId}`);
  return job;
};

// Get queue stats
const getQueueStats = async () => {
  const queue = getQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
};

module.exports = { getQueue, addWorkflowJob, getQueueStats };
