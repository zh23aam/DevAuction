const logger = require('../utils/logger');

const redact = (obj) => {
  const result = { ...obj };
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'key'];
  
  for (const key in result) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      result[key] = '[REDACTED]';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = redact(result[key]);
    }
  }
  return result;
};

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, url, query, body } = req;

  // Log incoming request
  const redactedQuery = redact(query);
  const redactedBody = redact(body);
  
  logger.debug(`[REQ] ${method} ${url}`, {
    query: Object.keys(redactedQuery).length ? redactedQuery : undefined,
    body: Object.keys(redactedBody).length ? redactedBody : undefined,
  });

  // Intercept the finish event to log outgoing response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    logger.info(`[RES] ${method} ${url} ${statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = loggerMiddleware;
