const mongoose = require("mongoose");
const executionStepSchema = new mongoose.Schema({
  logId:      { type: mongoose.Schema.Types.ObjectId, ref: "ExecutionLog", required: true },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow",     required: true },
  order:      { type: Number, required: true },
  service:    String, actionType: String,
  status:     { type: String, enum: ["success","failed","skipped"], required: true },
  input:      { type: mongoose.Schema.Types.Mixed },
  output:     { type: mongoose.Schema.Types.Mixed },
  error:      String, duration: Number,
}, { timestamps: true });
executionStepSchema.index({ logId: 1, order: 1 });
module.exports = mongoose.model("ExecutionStep", executionStepSchema);
