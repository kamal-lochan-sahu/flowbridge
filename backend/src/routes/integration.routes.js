const express = require("express");
const router  = express.Router();
const { getIntegrations, getIntegration } = require("../controllers/integration.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/",          getIntegrations);
router.get("/:service",  getIntegration);

module.exports = router;
