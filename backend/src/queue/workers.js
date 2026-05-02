const { getQueue }        = require("./jobQueue");
const { executeWorkflow } = require("../engine/workflowEngine");

let isWorkerStarted = false;

const startWorker = () => {
  if (isWorkerStarted) { console.log("⚠️  Worker already running"); return; }

  const queue = getQueue();

  queue.process("*", 5, async (job) => {
    const { workflowId, userId, triggerData, triggerType, logId } = job.data;

    console.log(`\n⚡ Processing job ${job.id}`);
    console.log(`   Workflow: ${workflowId}`);
    console.log(`   Trigger:  ${triggerType}`);

    try {
      const result = await executeWorkflow({
        workflowId,
        userId,
        triggerData,
        triggerType,
        logId,
      });

      console.log(`✅ Job ${job.id} done — Status: ${result.status}`);
      return result;
    } catch (error) {
      console.error(`❌ Job ${job.id} error:`, error.message);
      throw error; // Bull will retry
    }
  });

  isWorkerStarted = true;
  console.log("🔧 Worker started — listening for jobs (concurrency: 5)");
};

module.exports = { startWorker };
