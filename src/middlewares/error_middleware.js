const error_middleware = (error, req, res, next) => {
  let status_code = res.statusCode === 200 ? 500 : res.statusCode;
  let message = error.message || "Internal Server Error";

  if (error.name === "CastError") {
    status_code = 400;
    message = "Invalid resource ID";
  }

  if (error.code === 11000) {
    status_code = 409;

    const duplicated_field = Object.keys(error.keyValue || {})[0];

    message = duplicated_field
      ? `${duplicated_field} already exists`
      : "Duplicate field value";
  }

  if (error.name === "ValidationError") {
    status_code = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  res.status(status_code).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

export default error_middleware;
