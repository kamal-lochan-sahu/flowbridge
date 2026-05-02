const jwt = require("jsonwebtoken");
const ApiError = require("./ApiError");

const generateAccessToken  = (p) => jwt.sign(p, process.env.JWT_SECRET,          { expiresIn: process.env.JWT_EXPIRY || "15m" });
const generateRefreshToken = (p) => jwt.sign(p, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" });

const generateTokenPair = (user) => ({
  accessToken:  generateAccessToken({ _id: user._id, email: user.email, role: user.role }),
  refreshToken: generateRefreshToken({ _id: user._id }),
});

const verifyAccessToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch (e) { throw e.name === "TokenExpiredError" ? ApiError.unauthorized("Access token expired") : ApiError.unauthorized("Invalid access token"); }
};

const verifyRefreshToken = (token) => {
  try { return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET); }
  catch (e) { throw e.name === "TokenExpiredError" ? ApiError.unauthorized("Refresh token expired") : ApiError.unauthorized("Invalid refresh token"); }
};

module.exports = { generateAccessToken, generateRefreshToken, generateTokenPair, verifyAccessToken, verifyRefreshToken };
