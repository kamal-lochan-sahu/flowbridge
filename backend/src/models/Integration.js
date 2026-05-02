const mongoose = require("mongoose");
const integrationSchema = new mongoose.Schema({
  service:     { type: String, required: true, unique: true },
  displayName: String, description: String, icon: String, category: String,
  authType:    { type: String, enum: ["oauth2","api_key","basic","none"] },
  triggers:    [{ event: String, label: String, description: String, samplePayload: mongoose.Schema.Types.Mixed }],
  actions:     [{ actionType: String, label: String, description: String, configFields: mongoose.Schema.Types.Mixed }],
  isActive:    { type: Boolean, default: true },
  phase:       { type: Number, default: 1 },
}, { timestamps: true });
module.exports = mongoose.model("Integration", integrationSchema);
