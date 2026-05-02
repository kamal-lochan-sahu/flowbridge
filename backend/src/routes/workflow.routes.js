const express = require("express");
const router  = express.Router();
const {
  getWorkflows, createWorkflow, getWorkflow,
  updateWorkflow, deleteWorkflow,
  activateWorkflow, pauseWorkflow,
  runWorkflow, duplicateWorkflow,
  getWorkflowLogs, getWorkflowStats,
} = require("../controllers/workflow.controller");
const { authenticate }          = require("../middleware/auth.middleware");
const { validate }              = require("../middleware/validate.middleware");
const { createWorkflowSchema, updateWorkflowSchema } = require("../validators/workflow.validator");

router.use(authenticate);

router.get("/",              getWorkflows);
router.post("/",             validate(createWorkflowSchema), createWorkflow);
router.get("/:id",           getWorkflow);
router.put("/:id",           validate(updateWorkflowSchema), updateWorkflow);
router.delete("/:id",        deleteWorkflow);
router.put("/:id/activate",  activateWorkflow);
router.put("/:id/pause",     pauseWorkflow);
router.post("/:id/run",      runWorkflow);
router.post("/:id/duplicate",duplicateWorkflow);
router.get("/:id/logs",      getWorkflowLogs);
router.get("/:id/stats",     getWorkflowStats);

module.exports = router;
