// Jest setup file - runs before all tests
process.env.LIVEKIT_API_KEY = 'test-api-key';
process.env.LIVEKIT_API_SECRET = 'test-api-secret';
process.env.LIVEKIT_URL = 'ws://localhost:7880';
process.env.AUTH0_DOMAIN = 'test-tenant.auth0.com';
process.env.AUTH0_AUDIENCE = 'test-api-identifier';
process.env.MONGODB_URL = 'mongodb://localhost:27017/test';
process.env.PORT = '3001';

// Ensure tslib is available
try {
  require('tslib');
} catch (e) {
  // tslib not available, but that's okay for testing
}
