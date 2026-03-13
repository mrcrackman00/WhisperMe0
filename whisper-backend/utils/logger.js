/**
 * Simple request logger — logs method, path, status, duration.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'OK';
    console.log(`[${status}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}

module.exports = { requestLogger };
