const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && statusCode >= 500 ? 'Internal server error' : err.message;
  res.status(statusCode).json({
    success: false,
    message,
    stack: isProd ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
