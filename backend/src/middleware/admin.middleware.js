const ApiError = require("../utils/ApiError");
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized("Auth required"));
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden(`Required role: ${roles.join(" or ")}`));
  next();
};
module.exports = { requireRole, isOwner: requireRole("owner"), isAdminOrOwner: requireRole("owner","admin") };
