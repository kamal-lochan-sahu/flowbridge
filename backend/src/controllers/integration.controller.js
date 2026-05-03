const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const INTEGRATIONS = [
  { service: "gmail",          displayName: "Gmail",          category: "email",      authType: "oauth2",   phase: 1, isActive: true,
    actions: [{ actionType: "send_email", label: "Send Email" }] },
  { service: "google-sheets",  displayName: "Google Sheets",  category: "database",   authType: "oauth2",   phase: 1, isActive: true,
    actions: [{ actionType: "append_row", label: "Append Row" }, { actionType: "read_row", label: "Read Rows" }, { actionType: "update_row", label: "Update Row" }] },
  { service: "twilio",         displayName: "Twilio",         category: "messaging",  authType: "api_key",  phase: 1, isActive: true,
    actions: [{ actionType: "send_sms", label: "Send SMS" }, { actionType: "send_whatsapp", label: "Send WhatsApp" }] },
  { service: "pdf-generator",  displayName: "PDF Generator",  category: "document",   authType: "none",     phase: 1, isActive: true,
    actions: [{ actionType: "generate_pdf", label: "Generate PDF" }] },
  { service: "http-request",   displayName: "HTTP Request",   category: "utility",    authType: "none",     phase: 1, isActive: true,
    actions: [{ actionType: "request", label: "HTTP Request" }] },
  { service: "slack",          displayName: "Slack",          category: "messaging",  authType: "api_key",  phase: 1, isActive: true,
    actions: [{ actionType: "send_message", label: "Send Message" }] },
  { service: "mongodb",        displayName: "MongoDB",        category: "database",   authType: "api_key",  phase: 1, isActive: true,
    actions: [{ actionType: "insert_document", label: "Insert Document" }, { actionType: "find_document", label: "Find Document" }] },
  { service: "filter",         displayName: "Filter",         category: "logic",      authType: "none",     phase: 1, isActive: true,
    actions: [{ actionType: "condition", label: "Condition Check" }] },
  { service: "delay",          displayName: "Delay",          category: "logic",      authType: "none",     phase: 1, isActive: true,
    actions: [{ actionType: "wait", label: "Wait" }] },
  { service: "shopify",        displayName: "Shopify",        category: "ecommerce",  authType: "api_key",  phase: 2, isActive: true,
    triggers: [{ event: "order_created", label: "Order Created" }] },
  { service: "razorpay",       displayName: "Razorpay",       category: "payment",    authType: "api_key",  phase: 2, isActive: true,
    triggers: [{ event: "payment_captured", label: "Payment Captured" }] },
];

const getIntegrations = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { integrations: INTEGRATIONS });
});

const getIntegration = asyncHandler(async (req, res) => {
  const integration = INTEGRATIONS.find(i => i.service === req.params.service);
  if (!integration) return res.status(404).json({ success: false, message: "Integration not found" });
  return ApiResponse.success(res, { integration });
});

module.exports = { getIntegrations, getIntegration };
