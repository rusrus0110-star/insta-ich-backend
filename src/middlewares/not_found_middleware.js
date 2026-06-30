const not_found_middleware = (req, res, next) => {
  res.status(404);

  const error = new Error(`Route not found: ${req.originalUrl}`);

  next(error);
};

export default not_found_middleware;
