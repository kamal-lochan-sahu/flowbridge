const crypto     = require("crypto");
const User        = require("../models/User");
const ApiError    = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { generateTokenPair, verifyRefreshToken } = require("../utils/jwt.utils");
const { sendPasswordResetEmail } = require("../utils/email.utils");

// ── REGISTER ──────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("Email already registered");

  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = generateTokenPair(user);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.created(res, {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  }, "Account created successfully");
});

// ── LOGIN ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  if (!user.isActive) throw ApiError.forbidden("Account is deactivated");

  const { accessToken, refreshToken } = generateTokenPair(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  }, "Login successful");
});

// ── LOGOUT ────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });
  return ApiResponse.success(res, null, "Logged out successfully");
});

// ── REFRESH TOKEN ─────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingToken } = req.body;
  if (!incomingToken) throw ApiError.unauthorized("Refresh token required");

  const decoded = verifyRefreshToken(incomingToken);
  const user    = await User.findById(decoded._id).select("+refreshToken");

  if (!user)                            throw ApiError.unauthorized("User not found");
  if (user.refreshToken !== incomingToken) throw ApiError.unauthorized("Invalid refresh token");

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, {
    accessToken,
    refreshToken: newRefreshToken,
  }, "Tokens refreshed");
});

// ── FORGOT PASSWORD ───────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return success (don't reveal if email exists)
  if (!user) {
    return ApiResponse.success(res, null, "If this email exists, a reset link has been sent");
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken   = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (err) {
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal("Failed to send reset email");
  }

  return ApiResponse.success(res, null, "If this email exists, a reset link has been sent");
});

// ── RESET PASSWORD ────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken:   hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) throw ApiError.badRequest("Invalid or expired reset token");

  user.password             = password;
  user.resetPasswordToken   = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshToken         = undefined;
  await user.save();

  return ApiResponse.success(res, null, "Password reset successful — please login");
});

// ── CHANGE PASSWORD ───────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

  user.password     = newPassword;
  user.refreshToken = undefined;
  await user.save();

  return ApiResponse.success(res, null, "Password changed successfully — please login again");
});

// ── GET ME ────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { user: req.user.toSafeObject() }, "User fetched");
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};
