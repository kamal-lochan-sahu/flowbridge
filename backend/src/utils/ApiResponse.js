class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode; this.data = data;
    this.message = message; this.success = statusCode < 400;
  }
  static success(res, data, msg = "Success", code = 200)    { return res.status(code).json(new ApiResponse(code, data, msg)); }
  static created(res, data, msg = "Created successfully")    { return res.status(201).json(new ApiResponse(201, data, msg)); }
  static noContent(res)                                      { return res.status(204).send(); }
  static paginated(res, data, pagination, msg = "Success")   { return res.status(200).json({ statusCode:200, success:true, message:msg, data, pagination }); }
}
module.exports = ApiResponse;
