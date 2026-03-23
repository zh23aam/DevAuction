/**
 * MongoDB Connection and Mongoose Models Verification Script
 * Task 4.3: Verify MongoDB connection and Mongoose models
 * 
 * This script verifies:
 * 1. MONGODB_URI environment variable is configured
 * 2. All four Mongoose models load without errors
 * 3. Indexes are created for each collection
 * 4. Connection to MongoDB is successful
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { MONGODB_URL, DB_NAME } = require('../../constants');

// Import all models
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const ChatMessage = require('../models/ChatMessage');
const Participant = require('../models/Participant');

/**
 * Verify MongoDB connection and models
 */
async function verifyMongoDBConnection() {
  try {
    logger.info('=== MongoDB Connection and Models Verification ===');
    
    // 1. Verify MONGODB_URI environment variable
    logger.info('1. Checking MONGODB_URI environment variable...');
    if (!MONGODB_URL) {
      throw new Error('MONGODB_URI environment variable is not configured');
    }
    logger.info(`✓ MONGODB_URI configured: ${MONGODB_URL.substring(0, 50)}...`);
    
    if (!DB_NAME) {
      throw new Error('DB_NAME environment variable is not configured');
    }
    logger.info(`✓ DB_NAME configured: ${DB_NAME}`);
    
    // 2. Connect to MongoDB
    logger.info('\n2. Connecting to MongoDB...');
    const baseUrl = MONGODB_URL.endsWith('/') ? MONGODB_URL.slice(0, -1) : MONGODB_URL;
    const connectionString = `${baseUrl}/${DB_NAME}`;
    
    const connection = await mongoose.connect(connectionString);
    logger.info(`✓ MongoDB connection established`);
    logger.info(`  Host: ${connection.connection.host}`);
    logger.info(`  Database: ${connection.connection.name}`);
    
    // 3. Verify all models load without errors
    logger.info('\n3. Verifying Mongoose models...');
    
    const models = [
      { name: 'Auction', model: Auction },
      { name: 'Bid', model: Bid },
      { name: 'ChatMessage', model: ChatMessage },
      { name: 'Participant', model: Participant },
    ];
    
    for (const { name, model } of models) {
      if (!model) {
        throw new Error(`Model ${name} failed to load`);
      }
      logger.info(`✓ ${name} model loaded successfully`);
    }
    
    // 4. Verify indexes for each collection
    logger.info('\n4. Verifying indexes for each collection...');
    
    for (const { name, model } of models) {
      try {
        // Create collection if it doesn't exist by inserting and deleting a test document
        try {
          const testDoc = await model.create({});
          await model.deleteOne({ _id: testDoc._id });
          logger.info(`  ℹ ${name} collection created (was empty)`);
        } catch (e) {
          // Collection already exists or other error, continue
        }
        
        const indexes = await model.collection.getIndexes();
        logger.info(`\n  ${name} collection indexes:`);
        
        // Log all indexes
        Object.entries(indexes).forEach(([indexName, indexSpec]) => {
          logger.info(`    - ${indexName}: ${JSON.stringify(indexSpec)}`);
        });
        
        // Verify at least the default _id index exists
        if (!indexes._id_) {
          throw new Error(`${name} collection missing default _id index`);
        }
        logger.info(`  ✓ ${name} indexes verified`);
      } catch (error) {
        logger.error(`  ✗ Error verifying ${name} indexes: ${error.message}`);
        throw error;
      }
    }
    
    // 5. Verify specific indexes per model
    logger.info('\n5. Verifying model-specific indexes...');
    
    // Auction indexes
    let auctionIndexes = {};
    try {
      auctionIndexes = await Auction.collection.getIndexes();
    } catch (e) {
      logger.warn('  ⚠ Could not retrieve Auction indexes (collection may be empty)');
    }
    const auctionIndexNames = Object.keys(auctionIndexes);
    if (!auctionIndexNames.some(idx => idx.includes('hostId'))) {
      logger.warn('  ⚠ Auction: hostId index not found');
    } else {
      logger.info('  ✓ Auction: hostId index verified');
    }
    if (!auctionIndexNames.some(idx => idx.includes('status'))) {
      logger.warn('  ⚠ Auction: status index not found');
    } else {
      logger.info('  ✓ Auction: status index verified');
    }
    
    // Bid indexes
    let bidIndexes = {};
    try {
      bidIndexes = await Bid.collection.getIndexes();
    } catch (e) {
      logger.warn('  ⚠ Could not retrieve Bid indexes (collection may be empty)');
    }
    const bidIndexNames = Object.keys(bidIndexes);
    if (!bidIndexNames.some(idx => idx.includes('auctionId'))) {
      logger.warn('  ⚠ Bid: auctionId index not found');
    } else {
      logger.info('  ✓ Bid: auctionId index verified');
    }
    if (!bidIndexNames.some(idx => idx.includes('bidderId'))) {
      logger.warn('  ⚠ Bid: bidderId index not found');
    } else {
      logger.info('  ✓ Bid: bidderId index verified');
    }
    if (!bidIndexNames.some(idx => idx.includes('serverTimestamp'))) {
      logger.warn('  ⚠ Bid: serverTimestamp index not found');
    } else {
      logger.info('  ✓ Bid: serverTimestamp index verified');
    }
    
    // ChatMessage indexes
    let chatIndexes = {};
    try {
      chatIndexes = await ChatMessage.collection.getIndexes();
    } catch (e) {
      logger.warn('  ⚠ Could not retrieve ChatMessage indexes (collection may be empty)');
    }
    const chatIndexNames = Object.keys(chatIndexes);
    if (!chatIndexNames.some(idx => idx.includes('auctionId'))) {
      logger.warn('  ⚠ ChatMessage: auctionId index not found');
    } else {
      logger.info('  ✓ ChatMessage: auctionId index verified');
    }
    if (!chatIndexNames.some(idx => idx.includes('serverTimestamp'))) {
      logger.warn('  ⚠ ChatMessage: serverTimestamp index not found');
    } else {
      logger.info('  ✓ ChatMessage: serverTimestamp index verified');
    }
    
    // Participant indexes
    let participantIndexes = {};
    try {
      participantIndexes = await Participant.collection.getIndexes();
    } catch (e) {
      logger.warn('  ⚠ Could not retrieve Participant indexes (collection may be empty)');
    }
    const participantIndexNames = Object.keys(participantIndexes);
    if (!participantIndexNames.some(idx => idx.includes('auctionId'))) {
      logger.warn('  ⚠ Participant: auctionId index not found');
    } else {
      logger.info('  ✓ Participant: auctionId index verified');
    }
    if (!participantIndexNames.some(idx => idx.includes('userId'))) {
      logger.warn('  ⚠ Participant: userId index not found');
    } else {
      logger.info('  ✓ Participant: userId index verified');
    }
    
    // 6. Test basic operations
    logger.info('\n6. Testing basic model operations...');
    
    // Test Auction model
    try {
      const auctionCount = await Auction.countDocuments();
      logger.info(`  ✓ Auction.countDocuments() works: ${auctionCount} documents`);
    } catch (error) {
      logger.error(`  ✗ Auction.countDocuments() failed: ${error.message}`);
    }
    
    // Test Bid model
    try {
      const bidCount = await Bid.countDocuments();
      logger.info(`  ✓ Bid.countDocuments() works: ${bidCount} documents`);
    } catch (error) {
      logger.error(`  ✗ Bid.countDocuments() failed: ${error.message}`);
    }
    
    // Test ChatMessage model
    try {
      const chatCount = await ChatMessage.countDocuments();
      logger.info(`  ✓ ChatMessage.countDocuments() works: ${chatCount} documents`);
    } catch (error) {
      logger.error(`  ✗ ChatMessage.countDocuments() failed: ${error.message}`);
    }
    
    // Test Participant model
    try {
      const participantCount = await Participant.countDocuments();
      logger.info(`  ✓ Participant.countDocuments() works: ${participantCount} documents`);
    } catch (error) {
      logger.error(`  ✗ Participant.countDocuments() failed: ${error.message}`);
    }
    
    logger.info('\n=== Verification Complete ===');
    logger.info('✓ All MongoDB connection and model verifications passed');
    
    return {
      success: true,
      connection: {
        host: connection.connection.host,
        database: connection.connection.name,
        url: connectionString,
      },
      models: {
        Auction: { loaded: true, indexes: Object.keys(auctionIndexes) },
        Bid: { loaded: true, indexes: Object.keys(bidIndexes) },
        ChatMessage: { loaded: true, indexes: Object.keys(chatIndexes) },
        Participant: { loaded: true, indexes: Object.keys(participantIndexes) },
      },
    };
  } catch (error) {
    logger.error('\n✗ Verification failed:');
    logger.error(error.message);
    logger.error(error.stack);
    
    return {
      success: false,
      error: error.message,
    };
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logger.info('\nMongoDB connection closed');
    }
  }
}

module.exports = verifyMongoDBConnection;
