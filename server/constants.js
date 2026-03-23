// import dotenv from "dotenv"
// dotenv.config()
require('dotenv').config()

// export const PORT = process.env.PORT
// export const MONGODB_URL = process.env.MONGODB_URL
// export const DB_NAME = process.env.DB_NAME
// export const EMAIL = process.env.EMAIL
// export const APP_PASSWD = process.env.APP_PASSWD
// export const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY
// export const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY
// export const Webhook_Secret = process.env.Webhook_Secret
// (Deprecated Service Account variables removed)

const PORT = process.env.PORT
const MONGODB_URL = process.env.MONGODB_URL
const DB_NAME = process.env.DB_NAME
const EMAIL = process.env.EMAIL
const APP_PASSWD = process.env.APP_PASSWD
const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY
const Webhook_Secret = process.env.Webhook_Secret
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN
const CORS_ORIGIN = process.env.CORS_ORIGIN
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_URL = process.env.LIVEKIT_URL
const HOST_DISCONNECT_GRACE_PERIOD_MS = process.env.HOST_DISCONNECT_GRACE_PERIOD_MS || 300000
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE

/**
 * Validate required environment variables
 * Ensures critical backend credentials are configured before app starts
 */
function validateEnvironmentVariables() {
  const missingVars = [];

  // Check required variables
  if (!LIVEKIT_API_KEY) missingVars.push('LIVEKIT_API_KEY');
  if (!LIVEKIT_API_SECRET) missingVars.push('LIVEKIT_API_SECRET');
  if (!LIVEKIT_URL) missingVars.push('LIVEKIT_URL');
  if (!AUTH0_DOMAIN) missingVars.push('AUTH0_DOMAIN');
  if (!AUTH0_AUDIENCE) missingVars.push('AUTH0_AUDIENCE');
  if (!MONGODB_URL) missingVars.push('MONGODB_URL');
  if (!DB_NAME) missingVars.push('DB_NAME');

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`;
    console.error(`[ENVIRONMENT] ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

// Validate on module load
validateEnvironmentVariables();

module.exports = {
  PORT,
  MONGODB_URL,
  DB_NAME,
  EMAIL,
  APP_PASSWD,
  RAZORPAY_ID_KEY,
  RAZORPAY_SECRET_KEY,
  Webhook_Secret,
  GOOGLE_DRIVE_FOLDER_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  CORS_ORIGIN,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  HOST_DISCONNECT_GRACE_PERIOD_MS,
  AUTH0_DOMAIN,
  AUTH0_AUDIENCE
}

