const mongoose = require("mongoose");
const workflowTemplateSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: String, category: String, thumbnail: String,
  triggerConfig: { type: mongoose.Schema.Types.Mixed },
  actionsConfig: [{ type: mongoose.Schema.Types.Mixed }],
  requiredServices: [String],
  requiredVars: [{ key: String, label: String, type: String }],
  usageCount: { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("WorkflowTemplate", workflowTemplateSchema);
