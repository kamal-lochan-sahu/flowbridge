const crypto   = require("crypto");
const Trigger  = require("../models/Trigger");
const { handleWebhookTrigger } = require("../engine/triggerHandler");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Verify webhook signature (HMAC-SHA256)
const verifySignature = (payload, signature, secret) => {
  if (!secret || !signature) return true; // Skip if no secret set
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature.replace("sha256=","")),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
};

// ── RECEIVE WEBHOOK ───────────────────────────────────────────
const receiveWebhook = asyncHandler(async (req, res) => {
  const { webhookId } = req.params;

  // Parse body — raw buffer for signature check
  let rawBody = req.body;
  let payload = {};

  if (Buffer.isBuffer(rawBody)) {
    // Verify signature if present
    const signature = req.headers["x-hub-signature-256"] ||
                      req.headers["x-shopify-hmac-sha256"] ||
                      req.headers["x-webhook-signature"] || "";

    // Find trigger to get secret
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/receive/${webhookId}`;
    const trigger    = await Trigger.findOne({ "webhook.url": webhookUrl });

    if (trigger?.webhook?.secret && signature) {
      const valid = verifySignature(rawBody, signature, trigger.webhook.secret);
      if (!valid) {
        return res.status(401).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    // Parse JSON body
    try {
      payload = JSON.parse(rawBody.toString());
    } catch {
      payload = { raw: rawBody.toString() };
    }
  } else if (typeof rawBody === "object") {
    payload = rawBody;
  }

  // Always respond 200 immediately — then process async
  res.status(200).json({ success: true, message: "Webhook received" });

  // Queue the workflow (non-blocking)
  try {
    const result = await handleWebhookTrigger(webhookId, payload, req.headers);
    console.log(`✅ Webhook ${webhookId} queued — Job: ${result.jobId}`);
  } catch (error) {
    console.error(`❌ Webhook ${webhookId} error:`, error.message);
  }
});

// ── GET LAST PAYLOAD ──────────────────────────────────────────
const getLastPayload = asyncHandler(async (req, res) => {
  const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/receive/${req.params.id}`;
  const trigger    = await Trigger.findOne({
    "webhook.url": webhookUrl,
    userId: req.user._id,
  });

  if (!trigger) return res.status(404).json({ success: false, message: "Webhook not found" });

  return ApiResponse.success(res, {
    lastPayload:  trigger.lastPayload,
    webhookUrl:   trigger.webhook?.url,
    lastReceived: trigger.updatedAt,
  });
});

module.exports = { receiveWebhook, getLastPayload };
