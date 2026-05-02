const { verifyAccessToken } = require("../utils/jwt.utils");
const User         = require("../models/User");
const ApiError     = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) throw ApiError.unauthorized("No token provided");
  const decoded = verifyAccessToken(auth.split(" ")[1]);
  const user    = await User.findById(decoded._id).select("-password -refreshToken");
  if (!user)          throw ApiError.unauthorized("User not found");
  if (!user.isActive) throw ApiError.forbidden("Account deactivated");
  req.user = user;
  next();
});

module.exports = { authenticate };
