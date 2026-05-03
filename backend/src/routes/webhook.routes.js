const express = require("express");
const router  = express.Router();
const { receiveWebhook, getLastPayload } = require("../controllers/webhook.controller");
const { authenticate }   = require("../middleware/auth.middleware");
const { webhookLimiter } = require("../middleware/rateLimit.middleware");

// Public — external services call this
router.post("/receive/:webhookId", webhookLimiter, receiveWebhook);

// Protected — user sees last payload
router.get("/:id/payload", authenticate, getLastPayload);

module.exports = router;
