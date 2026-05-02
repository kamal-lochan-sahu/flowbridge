const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 8, select: false },
  avatar:   { type: String, default: null },
  role:     { type: String, enum: ["owner","admin","viewer"], default: "owner" },
  branding: {
    companyName:  { type: String, default: "" },
    logo:         { type: String, default: "" },
    primaryColor: { type: String, default: "#3b82f6" },
    domain:       { type: String, default: "" },
  },
  plan:   { type: String, enum: ["free","starter","pro","enterprise"], default: "free" },
  limits: { maxWorkflows: { type: Number, default: 5 }, maxExecutions: { type: Number, default: 100 } },
  notifications: { emailOnFailure: { type: Boolean, default: true }, dailySummary: { type: Boolean, default: false } },
  logRetentionDays: { type: Number, default: 30 },
  isActive:     { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  googleId:     { type: String, default: null },
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date,   select: false },
}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password; delete obj.refreshToken;
  delete obj.resetPasswordToken; delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
