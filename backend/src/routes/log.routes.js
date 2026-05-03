const express = require("express");
const router  = express.Router();
const { getLogs, getLog, getLogSteps, retryLog, clearLogs } = require("../controllers/log.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/",              getLogs);
router.get("/:id",           getLog);
router.get("/:id/steps",     getLogSteps);
router.post("/:id/retry",    retryLog);
router.delete("/clear",      clearLogs);

module.exports = router;
