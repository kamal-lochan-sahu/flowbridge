module.exports = {
  ROLES:            { OWNER: "owner", ADMIN: "admin", VIEWER: "viewer" },
  WORKFLOW_STATUS:  { ACTIVE: "active", PAUSED: "paused", DRAFT: "draft" },
  TRIGGER_TYPES:    { WEBHOOK: "webhook", SCHEDULE: "schedule", MANUAL: "manual", FORM: "form" },
  EXECUTION_STATUS: { RUNNING: "running", SUCCESS: "success", FAILED: "failed", PARTIAL: "partial" },
  SERVICES:         { GMAIL: "gmail", SHEETS: "google-sheets", PDF: "pdf-generator", TWILIO: "twilio", HTTP: "http-request", SLACK: "slack", SHOPIFY: "shopify", RAZORPAY: "razorpay", MONGODB: "mongodb", FILTER: "filter", DELAY: "delay" },
  RETRY_INTERVALS:  [1, 5, 15],
};
