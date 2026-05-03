const Bull = require("bull");

let workflowQueue = null;

const getQueue = () => {
  if (workflowQueue) return workflowQueue;

  const redisUrl = process.env.REDIS_URL;

  // Parse URL for TLS config
  const url = new URL(redisUrl);

  const redisOptions = {
    host:     url.hostname,
    port:     parseInt(url.port) || 6379,
    password: url.password,
    tls:      redisUrl.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 3,
    enableReadyCheck:     false,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 1000, 3000);
    },
  };

  workflowQueue = new Bull("workflow-execution", { redis: redisOptions, defaultJobOptions: {
    attempts:         3,
    backoff:          { type: "fixed", delay: 60000 },
    removeOnComplete: 100,
    removeOnFail:     200,
  }});

  workflowQueue.on("error",     (err) => console.error("❌ Queue error:", err.message));
  workflowQueue.on("active",    (job) => console.log(`⚡ Job ${job.id} started — Workflow: ${job.data.workflowId}`));
  workflowQueue.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
  workflowQueue.on("failed",    (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));

  console.log("✅ Workflow Queue initialized");
  return workflowQueue;
};

const addWorkflowJob = async (data, options = {}) => {
  const queue = getQueue();
  const job   = await queue.add(data, options);
  console.log(`📥 Job ${job.id} added — Workflow: ${data.workflowId}`);
  return job;
};

const getQueueStats = async () => {
  const queue = getQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(), queue.getActiveCount(),
    queue.getCompletedCount(), queue.getFailedCount(), queue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
};

module.exports = { getQueue, addWorkflowJob, getQueueStats };
