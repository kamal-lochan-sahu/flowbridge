const express = require("express");
const router  = express.Router();
const {
  getCredentials, createCredential, updateCredential,
  deleteCredential, testCredential,
  googleOAuthStart, googleOAuthCallback,
} = require("../controllers/credential.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate }     = require("../middleware/validate.middleware");
const { createCredentialSchema, updateCredentialSchema } = require("../validators/credential.validator");

// OAuth callback — no auth middleware (Google redirects here)
router.get("/oauth/google/callback", googleOAuthCallback);

// All other routes need auth
router.use(authenticate);

router.get("/",            getCredentials);
router.post("/",           validate(createCredentialSchema), createCredential);
router.put("/:id",         validate(updateCredentialSchema), updateCredential);
router.delete("/:id",      deleteCredential);
router.post("/:id/test",   testCredential);
router.get("/oauth/google",googleOAuthStart);

module.exports = router;
