const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { AUTH0_DOMAIN, AUTH0_AUDIENCE } = require('../../constants');
const logger = require('./logger');

/**
 * Create Auth0 JWKS client for RS256 verification
 */
const jwksClient = jwksRsa({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

/**
 * Get signing key from Auth0 JWKS endpoint
 * @param {Object} header - JWT header
 * @param {Function} callback - Callback with (err, key)
 */
function getKey(header, callback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('[AUTH0] Error getting signing key:', err.message);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify Auth0 RS256 JWT token
 * @param {string} token - JWT token to verify
 * @param {Function} callback - Callback with (err, decoded)
 */
function verifyAuth0Token(token, callback) {
  jwt.verify(
    token,
    getKey,
    {
      audience: AUTH0_AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    },
    callback
  );
}

module.exports = {
  verifyAuth0Token,
};
