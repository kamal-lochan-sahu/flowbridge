const rateLimit = require("express-rate-limit");
const ApiError  = require("../utils/ApiError");
const make = (windowMs, max, msg) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, handler: (q,r,n) => n(ApiError.tooManyRequests(msg)) });
module.exports = {
  apiLimiter:     make(parseInt(process.env.RATE_LIMIT_WINDOW_MS)||60000, parseInt(process.env.RATE_LIMIT_MAX)||100, "Too many requests"),
  authLimiter:    make(15*60000, 10,  "Too many login attempts — try again in 15 minutes"),
  webhookLimiter: make(60000,    500, "Webhook rate limit exceeded"),
};
