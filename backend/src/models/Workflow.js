const mongoose = require("mongoose");
const workflowSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  status:      { type: String, enum: ["active","paused","draft"], default: "draft" },
  trigger:     { type: mongoose.Schema.Types.ObjectId, ref: "Trigger" },
  actions:     [{ order: Number, actionId: { type: mongoose.Schema.Types.ObjectId, ref: "Action" } }],
  stats: {
    totalRuns:   { type: Number, default: 0 },
    successRuns: { type: Number, default: 0 },
    failedRuns:  { type: Number, default: 0 },
    lastRunAt:   { type: Date,   default: null },
  },
  fromTemplate: { type: mongoose.Schema.Types.ObjectId, ref: "WorkflowTemplate", default: null },
  tags: [String],
}, { timestamps: true });
workflowSchema.index({ userId: 1, status: 1 });
module.exports = mongoose.model("Workflow", workflowSchema);
