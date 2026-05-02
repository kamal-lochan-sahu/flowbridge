const Workflow      = require("../models/Workflow");
const Action        = require("../models/Action");
const Trigger       = require("../models/Trigger");
const ExecutionLog  = require("../models/ExecutionLog");
const ExecutionStep = require("../models/ExecutionStep");
const { resolveVariables }   = require("./variableResolver");
const { executeAction }      = require("./actionExecutor");
const { evaluateCondition }  = require("./conditionEvaluator");

const executeWorkflow = async ({ workflowId, userId, triggerData, triggerType, logId }) => {
  const startTime = Date.now();

  // Load workflow + actions
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
  if (workflow.status !== "active") throw new Error("Workflow is not active");

  const actions = await Action.find({ workflowId }).sort({ order: 1 });

  // Create or load execution log
  let log;
  if (logId) {
    log = await ExecutionLog.findById(logId);
    log.status    = "running";
    log.startedAt = new Date();
    await log.save();
  } else {
    log = await ExecutionLog.create({
      workflowId, userId,
      status:      "running",
      triggerType: triggerType || "manual",
      triggerData: triggerData || {},
      startedAt:   new Date(),
    });
  }

  let overallStatus = "success";
  let errorInfo     = null;
  const steps       = [];

  // Execute each action in order
  for (const action of actions) {
    const stepStart = Date.now();

    try {
      // Resolve variables in config
      const resolvedConfig = resolveVariables(action.config, {
        trigger: triggerData || {},
        steps,
      });

      // Filter/Condition check
      if (action.service === "filter") {
        const pass = evaluateCondition(resolvedConfig, { trigger: triggerData, steps });
        if (!pass) {
          // Log skipped step
          await ExecutionStep.create({
            logId: log._id, workflowId, order: action.order,
            service: action.service, actionType: action.actionType,
            status: "skipped",
            input:  resolvedConfig,
            output: { message: "Condition not met — workflow stopped" },
            duration: Date.now() - stepStart,
          });
          overallStatus = "success"; // Not a failure — intentional stop
          break;
        }
        steps.push({ order: action.order, service: "filter", output: { passed: true } });
        continue;
      }

      // Delay action
      if (action.service === "delay") {
        const ms = (resolvedConfig.duration || 1) *
          (resolvedConfig.unit === "minutes" ? 60000 :
           resolvedConfig.unit === "hours"   ? 3600000 : 1000);
        await new Promise(r => setTimeout(r, Math.min(ms, 30000))); // Max 30s in dev
        steps.push({ order: action.order, service: "delay", output: { waited: ms } });
        continue;
      }

      // Execute the actual action
      const output = await executeAction(action, resolvedConfig, userId);

      // Save step log
      await ExecutionStep.create({
        logId: log._id, workflowId, order: action.order,
        service: action.service, actionType: action.actionType,
        status:   "success",
        input:    { config: resolvedConfig },
        output,
        duration: Date.now() - stepStart,
      });

      steps.push({ order: action.order, service: action.service, output });

    } catch (error) {
      overallStatus = "failed";
      errorInfo     = { message: error.message, step: action.order, service: action.service };

      await ExecutionStep.create({
        logId: log._id, workflowId, order: action.order,
        service: action.service, actionType: action.actionType,
        status:   "failed",
        input:    { config: action.config },
        error:    error.message,
        duration: Date.now() - stepStart,
      });

      console.error(`❌ Step ${action.order} (${action.service}) failed:`, error.message);

      // Retry logic — throw so Bull retries the whole job
      if (action.retry?.enabled) throw error;
      break;
    }
  }

  // Update execution log
  const duration = Date.now() - startTime;
  log.status      = overallStatus;
  log.completedAt = new Date();
  log.duration    = duration;
  if (errorInfo) log.error = errorInfo;
  await log.save();

  // Update workflow stats
  workflow.stats.totalRuns++;
  if (overallStatus === "success") workflow.stats.successRuns++;
  else                             workflow.stats.failedRuns++;
  workflow.stats.lastRunAt = new Date();
  await workflow.save({ validateBeforeSave: false });

  console.log(`✅ Workflow ${workflowId} — ${overallStatus} in ${duration}ms`);
  return { status: overallStatus, duration, logId: log._id };
};

module.exports = { executeWorkflow };
