const mongoose = require("mongoose");
const executionLogSchema = new mongoose.Schema({
  workflowId:  { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
  status:      { type: String, enum: ["running","success","failed","partial"], default: "running" },
  triggerType: String,
  triggerData: { type: mongoose.Schema.Types.Mixed },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  duration:    { type: Number, default: null },
  error:       { message: String, step: Number, service: String },
  isRetry:     { type: Boolean, default: false },
  retryCount:  { type: Number,  default: 0 },
  originalLogId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });
executionLogSchema.index({ workflowId: 1, status: 1, createdAt: -1 });
executionLogSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model("ExecutionLog", executionLogSchema);
