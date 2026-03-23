#!/usr/bin/env node

/**
 * MongoDB Connection Verification Script
 * Run: npm run verify:mongodb
 * 
 * This script verifies:
 * 1. MONGODB_URI environment variable is configured
 * 2. All four Mongoose models load without errors
 * 3. Indexes are created for each collection
 * 4. Connection to MongoDB is successful
 */

require('dotenv').config();

const verifyMongoDBConnection = require('./src/db/verifyConnection');

async function main() {
  const result = await verifyMongoDBConnection();
  
  if (result.success) {
    console.log('\n✓ MongoDB verification successful');
    process.exit(0);
  } else {
    console.error('\n✗ MongoDB verification failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
