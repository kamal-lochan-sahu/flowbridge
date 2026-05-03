const express = require("express");
const router  = express.Router();
const { getDashboardStats, getRunChart, getRecentActivity } = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/stats",  getDashboardStats);
router.get("/chart",  getRunChart);
router.get("/recent", getRecentActivity);

module.exports = router;
