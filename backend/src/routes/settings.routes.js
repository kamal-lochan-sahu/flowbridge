const express = require("express");
const router  = express.Router();
const {
  getSettings, updateProfile, updateBranding,
  updateNotifications, exportWorkflows, importWorkflows,
} = require("../controllers/settings.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/",              getSettings);
router.put("/profile",       updateProfile);
router.put("/branding",      updateBranding);
router.put("/notifications", updateNotifications);
router.get("/export",        exportWorkflows);
router.post("/import",       importWorkflows);

module.exports = router;
