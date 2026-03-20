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
  CORS_ORIGIN
}

