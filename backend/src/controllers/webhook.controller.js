const crypto   = require("crypto");
const Trigger  = require("../models/Trigger");
const { handleWebhookTrigger } = require("../engine/triggerHandler");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Providers that sign the raw body with HMAC-SHA256 (hex or base64)
const SIGNATURE_HEADERS = [
  "x-hub-signature-256",     // GitHub
  "x-shopify-hmac-sha256",   // Shopify (base64)
  "x-razorpay-signature",    // Razorpay
  "x-webhook-signature",     // generic / FlowBridge
];

const sha = (v) => crypto.createHash("sha256").update(String(v)).digest();

// HMAC-SHA256 over the raw body. Accepts "sha256=<hex>", plain hex, or base64.
// Fail-closed: no secret or no signature => false.
const verifySignature = (rawBody, signature, secret) => {
  if (!secret || !signature) return false;
  const provided = String(signature).trim().replace(/^sha256=/i, "");
  const mac = crypto.createHmac("sha256", secret).update(rawBody).digest(); // 32 bytes
  if (/^[0-9a-f]{64}$/i.test(provided)) {
    return crypto.timingSafeEqual(Buffer.from(provided, "hex"), mac);
  }
  if (/^[A-Za-z0-9+/]{43}=$/.test(provided)) {
    return crypto.timingSafeEqual(Buffer.from(provided, "base64"), mac);
  }
  return false;
};

// For senders that cannot compute an HMAC (Zapier, Make, curl): shared secret in a header.
const verifySharedSecret = (provided, secret) => {
  if (!secret || !provided) return false;
  return crypto.timingSafeEqual(sha(provided), sha(secret));
};

const isAuthentic = (req, rawBody, secret) => {
  if (!secret) return false;
  for (const h of SIGNATURE_HEADERS) {
    const sig = req.headers[h];
    if (sig && verifySignature(rawBody, sig, secret)) return true;
  }
  const auth   = req.headers["authorization"] || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return verifySharedSecret(req.headers["x-webhook-secret"] || bearer, secret);
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── RECEIVE WEBHOOK ───────────────────────────────────────────
const receiveWebhook = asyncHandler(async (req, res) => {
  const { webhookId } = req.params;
  if (!UUID_RE.test(webhookId)) return res.status(404).json({ success: false, message: "Webhook not found" });

  // express.raw gives a Buffer; an empty body arrives as {} — still must be authenticated
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

  const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/receive/${webhookId}`;
  const trigger    = await Trigger.findOne({ "webhook.url": webhookUrl });
  if (!trigger) return res.status(404).json({ success: false, message: "Webhook not found" });

  // Fail closed: every request must prove knowledge of the trigger secret
  if (!isAuthentic(req, rawBody, trigger.webhook?.secret)) {
    return res.status(401).json({ success: false, message: "Invalid or missing webhook signature" });
  }

  let payload = {};
  if (rawBody.length) {
    try {
      payload = JSON.parse(rawBody.toString());
    } catch {
      payload = { raw: rawBody.toString() };
    }
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

module.exports = { receiveWebhook, getLastPayload, verifySignature, verifySharedSecret };
