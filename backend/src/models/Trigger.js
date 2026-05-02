const mongoose = require("mongoose");
const triggerSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
  type:       { type: String, enum: ["webhook","schedule","manual","form"], required: true },
  webhook:  { url: String, secret: String, method: { type: String, default: "POST" }, service: String, event: String },
  schedule: { cronExpression: String, timezone: { type: String, default: "Asia/Kolkata" }, humanReadable: String },
  form:     { fields: [{ name: String, label: String, type: String, required: Boolean }], embedCode: String },
  lastPayload: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });
triggerSchema.index({ workflowId: 1 });
triggerSchema.index({ "webhook.url": 1 }, { unique: true, sparse: true });
module.exports = mongoose.model("Trigger", triggerSchema);
