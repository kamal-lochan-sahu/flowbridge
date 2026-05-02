const ApiError = require("../utils/ApiError");

const errorMiddleware = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) error = new ApiError(error.statusCode || 500, error.message || "Something went wrong", [], err.stack);
  if (err.name === "ValidationError") error = new ApiError(400, "Validation Error", Object.values(err.errors).map((e) => e.message));
  if (err.code === 11000)             error = new ApiError(409, `${Object.keys(err.keyValue)[0]} already exists`);
  if (err.name === "CastError")         error = new ApiError(400, `Invalid ${err.path}`);
  if (err.name === "JsonWebTokenError") error = new ApiError(401, "Invalid token");
  if (err.name === "TokenExpiredError") error = new ApiError(401, "Token expired");
  if (error.statusCode >= 500) console.error("🔴", req.method, req.originalUrl, error.message);
  return res.status(error.statusCode).json({
    success: false, statusCode: error.statusCode, message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

const notFoundMiddleware = (req, res, next) => next(ApiError.notFound(`Route not found: ${req.originalUrl}`));

module.exports = { errorMiddleware, notFoundMiddleware };
