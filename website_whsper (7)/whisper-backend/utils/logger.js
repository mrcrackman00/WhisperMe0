/**
 * Simple request logger — logs method, path, status, duration.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    console.log(log);
  });
  next();
}

module.exports = { requestLogger };
