const ApiError = require("../utils/ApiError");
const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest("Validation failed", error.details.map((d) => d.message.replace(/"/g,""))));
  req[source] = value; next();
};
module.exports = { validate };
