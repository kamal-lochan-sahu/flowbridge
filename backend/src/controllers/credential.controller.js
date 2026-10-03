const Credential  = require("../models/Credential");
const ApiError    = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler  = require("../utils/asyncHandler");
const { encryptCredentials, decryptCredentials } = require("../config/encryption");
const { getAuthUrl, getTokensFromCode } = require("../config/google");
const { createOAuthState, consumeOAuthState } = require("../utils/oauthState");
const User = require("../models/User");

// Service test functions
const testServiceConnection = async (service, authType, credentials) => {
  try {
    if (service === "twilio") {
      const twilio = require("twilio");
      const client = twilio(credentials.account_sid, credentials.auth_token);
      await client.api.accounts(credentials.account_sid).fetch();
      return { success: true, message: "Twilio connected" };
    }

    if (service === "gmail" || service === "google-sheets") {
      const { google }   = require("googleapis");
      const { getOAuthClient } = require("../config/google");
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({
        access_token:  credentials.access_token,
        refresh_token: credentials.refresh_token,
      });
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      await oauth2.userinfo.get();
      return { success: true, message: "Google connected" };
    }

    if (service === "slack") {
      const axios = require("axios");
      const res   = await axios.get("https://slack.com/api/auth.test", {
        headers: { Authorization: `Bearer ${credentials.api_key}` },
      });
      if (!res.data.ok) throw new Error(res.data.error);
      return { success: true, message: `Slack connected as ${res.data.user}` };
    }

    if (service === "shopify") {
      // Only real Shopify admin hosts — prevents sending the token to an attacker-chosen host (SSRF)
      if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(String(credentials.shop_domain || ""))) {
        throw new Error("Invalid Shopify domain (expected your-shop.myshopify.com)");
      }
      const axios = require("axios");
      const res   = await axios.get(
        `https://${credentials.shop_domain}/admin/api/2024-01/shop.json`,
        { headers: { "X-Shopify-Access-Token": credentials.api_key } }
      );
      return { success: true, message: `Shopify: ${res.data.shop.name}` };
    }

    return { success: true, message: "Credential saved (auto-test not available for this service)" };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// ── GET ALL CREDENTIALS ───────────────────────────────────────
const getCredentials = asyncHandler(async (req, res) => {
  const credentials = await Credential.find({ userId: req.user._id })
    .select("-credentials") // Never send encrypted data in list
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { credentials });
});

// ── ADD CREDENTIAL ────────────────────────────────────────────
const createCredential = asyncHandler(async (req, res) => {
  const { name, service, authType, credentials } = req.body;

  // Check duplicate name for same service
  const existing = await Credential.findOne({ userId: req.user._id, name, service });
  if (existing) throw ApiError.conflict("Credential with this name already exists for this service");

  // Encrypt credentials before saving
  const encrypted = encryptCredentials(credentials);

  const credential = await Credential.create({
    userId: req.user._id,
    name, service, authType,
    credentials: encrypted,
    isValid: true,
  });

  return ApiResponse.created(res, {
    credential: { ...credential.toObject(), credentials: undefined },
  }, "Credential added successfully");
});

// ── UPDATE CREDENTIAL ─────────────────────────────────────────
const updateCredential = asyncHandler(async (req, res) => {
  const { name, credentials } = req.body;

  const credential = await Credential.findOne({ _id: req.params.id, userId: req.user._id });
  if (!credential) throw ApiError.notFound("Credential not found");

  if (name)        credential.name = name;
  if (credentials) credential.credentials = encryptCredentials(credentials);

  await credential.save();

  return ApiResponse.success(res, {
    credential: { ...credential.toObject(), credentials: undefined },
  }, "Credential updated");
});

// ── DELETE CREDENTIAL ─────────────────────────────────────────
const deleteCredential = asyncHandler(async (req, res) => {
  const credential = await Credential.findOne({ _id: req.params.id, userId: req.user._id });
  if (!credential) throw ApiError.notFound("Credential not found");

  await credential.deleteOne();
  return ApiResponse.success(res, null, "Credential deleted");
});

// ── TEST CREDENTIAL ───────────────────────────────────────────
const testCredential = asyncHandler(async (req, res) => {
  const credential = await Credential.findOne({ _id: req.params.id, userId: req.user._id });
  if (!credential) throw ApiError.notFound("Credential not found");

  // Decrypt to test
  const decrypted = decryptCredentials(credential.credentials);
  const result    = await testServiceConnection(credential.service, credential.authType, decrypted);

  // Update validity
  credential.isValid      = result.success;
  credential.lastTestedAt = new Date();
  await credential.save();

  return ApiResponse.success(res, result, result.success ? "Connection successful" : "Connection failed");
});

// ── GOOGLE OAUTH START ────────────────────────────────────────
const googleOAuthStart = asyncHandler(async (req, res) => {
  const service = ["gmail", "google-sheets"].includes(req.query.service) ? req.query.service : "gmail";

  // Signed + expiring + single-use state bound to the logged-in user
  const state   = await createOAuthState(req.user._id.toString(), service);
  const authUrl = getAuthUrl("full", state);

  return ApiResponse.success(res, { authUrl }, "Google OAuth URL generated");
});

// ── GOOGLE OAUTH CALLBACK ─────────────────────────────────────
const googleOAuthCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${process.env.CLIENT_URL}/credentials?error=google_denied`);
  if (!code) throw ApiError.badRequest("Authorization code missing");

  let userId, service;
  try {
    ({ userId, service } = await consumeOAuthState(state));
  } catch {
    throw ApiError.badRequest("Invalid or expired state parameter");
  }
  const owner = await User.findOne({ _id: userId, isActive: true }).select("_id");
  if (!owner) throw ApiError.badRequest("Invalid state parameter");

  const tokens = await getTokensFromCode(code);

  // Get user email from Google
  const { google }   = require("googleapis");
  const { getAuthenticatedClient } = require("../config/google");
  const authClient   = getAuthenticatedClient(tokens);
  const oauth2       = google.oauth2({ version: "v2", auth: authClient });
  const { data }     = await oauth2.userinfo.get();

  // Save or update credential
  const credData = {
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry:  tokens.expiry_date,
    email:         data.email,
  };

  const existing = await Credential.findOne({ userId, service: "gmail" });
  if (existing) {
    existing.credentials  = encryptCredentials(credData);
    existing.isValid      = true;
    existing.lastTestedAt = new Date();
    await existing.save();
  } else {
    await Credential.create({
      userId,
      name:        `Google (${data.email})`,
      service:     "gmail",
      authType:    "oauth2",
      credentials: encryptCredentials(credData),
      isValid:     true,
      lastTestedAt: new Date(),
    });
  }

  // Redirect to frontend
  res.redirect(`${process.env.CLIENT_URL}/credentials?connected=google`);
});

module.exports = {
  getCredentials, createCredential, updateCredential,
  deleteCredential, testCredential,
  googleOAuthStart, googleOAuthCallback,
};
