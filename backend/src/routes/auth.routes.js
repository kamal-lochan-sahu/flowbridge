const express = require("express");
const router  = express.Router();

const {
  register, login, logout,
  refreshToken, forgotPassword,
  resetPassword, changePassword, getMe,
} = require("../controllers/auth.controller");

const { authenticate }   = require("../middleware/auth.middleware");
const { authLimiter }    = require("../middleware/rateLimit.middleware");
const { validate }       = require("../middleware/validate.middleware");

const {
  registerSchema, loginSchema,
  forgotPasswordSchema, resetPasswordSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");

// Public routes
router.post("/register",       validate(registerSchema),       register);
router.post("/login",          authLimiter, validate(loginSchema), login);
router.post("/refresh-token",  refreshToken);
router.post("/forgot-password",validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema),  resetPassword);

// Protected routes
router.post("/logout",          authenticate, logout);
router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);
router.get("/me",               authenticate, getMe);

module.exports = router;
