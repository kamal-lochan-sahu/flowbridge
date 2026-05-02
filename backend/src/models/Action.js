const mongoose = require("mongoose");
const actionSchema = new mongoose.Schema({
  workflowId:   { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
  order:        { type: Number, required: true },
  service:      { type: String, required: true },
  actionType:   { type: String, required: true },
  config:       { type: mongoose.Schema.Types.Mixed, default: {} },
  credentialId: { type: mongoose.Schema.Types.ObjectId, ref: "Credential", default: null },
  retry: { enabled: { type: Boolean, default: true }, maxAttempts: { type: Number, default: 3 }, intervals: { type: [Number], default: [1,5,15] } },
}, { timestamps: true });
actionSchema.index({ workflowId: 1, order: 1 });
module.exports = mongoose.model("Action", actionSchema);
