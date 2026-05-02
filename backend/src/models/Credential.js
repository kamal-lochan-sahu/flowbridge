const mongoose = require("mongoose");
const credentialSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:         { type: String, required: true, trim: true },
  service:      { type: String, required: true },
  authType:     { type: String, enum: ["oauth2","api_key","basic"], required: true },
  credentials:  { type: String, required: true },
  isValid:      { type: Boolean, default: true },
  lastTestedAt: { type: Date, default: null },
}, { timestamps: true });
credentialSchema.index({ userId: 1, service: 1 });
module.exports = mongoose.model("Credential", credentialSchema);
