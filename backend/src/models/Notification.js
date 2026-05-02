const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type:       { type: String, enum: ["workflow_failed","workflow_success","credential_expired","system"], required: true },
  title: String, message: String,
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow",      default: null },
  logId:      { type: mongoose.Schema.Types.ObjectId, ref: "ExecutionLog",  default: null },
  isRead:     { type: Boolean, default: false },
}, { timestamps: true });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
module.exports = mongoose.model("Notification", notificationSchema);
