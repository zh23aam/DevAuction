const { Mutex } = require('async-mutex');

/**
 * Auction Service
 * Utility module for auction business logic
 * Called by controllers to manage bidding, timers, and auction state
 */

// Map to store mutex instances per auction (auctionId -> Mutex)
const auctionMutexes = new Map();

/**
 * Get or create a mutex for an auction
 * @param {string} auctionId - Auction ID
 * @returns {Mutex} Mutex instance for the auction
 */
function getMutex(auctionId) {
  if (!auctionMutexes.has(auctionId)) {
    auctionMutexes.set(auctionId, new Mutex());
  }
  return auctionMutexes.get(auctionId);
}

/**
 * Error wrapper for auction operations
 * Catches and logs errors without exposing sensitive data
 */
class AuctionError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'AuctionError';
    console.error(`[AuctionError] ${message}`, {
      errorType: originalError?.name,
      errorMessage: originalError?.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Wrapper for safe error handling in auction operations
 * @param {Function} operation - Async function to execute
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise} Result of operation or throws AuctionError
 */
async function withErrorHandling(operation, operationName) {
  try {
    return await operation();
  } catch (error) {
    throw new AuctionError(
      `Auction ${operationName} failed: ${error.message}`,
      error
    );
  }
}

/**
 * Get database models (dynamically required to avoid circular dependencies)
 * @returns {Object} Object with Auction, Bid, ChatMessage, Participant models
 */
function getModels() {
  try {
    const Auction = require('../models/Auction');
    const Bid = require('../models/Bid');
    const ChatMessage = require('../models/ChatMessage');
    const Participant = require('../models/Participant');
    return { Auction, Bid, ChatMessage, Participant };
  } catch (error) {
    // Models not yet created; return null to allow graceful degradation
    return { Auction: null, Bid: null, ChatMessage: null, Participant: null };
  }
}

/**
 * Validate a bid against auction rules
 * @param {string} auctionId - Auction ID
 * @param {string} bidderId - Bidder user ID
 * @param {number} bidAmount - Bid amount
 * @returns {Promise<{isValid: boolean, error?: string, requiredMinimumBid?: number}>}
 */
async function validateBid(auctionId, bidderId, bidAmount) {
  return withErrorHandling(async () => {
    if (!auctionId || !bidderId || bidAmount === undefined) {
      throw new Error('Missing required parameters: auctionId, bidderId, bidAmount');
    }

    if (typeof bidAmount !== 'number' || bidAmount <= 0) {
      throw new Error('Bid amount must be a positive number');
    }

    const { Auction } = getModels();
    if (!Auction) {
      throw new Error('Auction model not available');
    }

    // Retrieve current auction state
    const auction = await Auction.findOne({ roomId: auctionId });
    if (!auction) {
      return {
        isValid: false,
        error: 'Auction not found',
      };
    }

    // Check if bid is strictly greater than current highest bid
    if (bidAmount <= auction.currentHighestBid) {
      const requiredMinimumBid = auction.currentHighestBid + auction.minimumIncrement;
      return {
        isValid: false,
        error: 'Bid must be greater than current highest bid',
        requiredMinimumBid,
      };
    }

    // Check if bid meets minimum increment requirement
    const bidDifference = bidAmount - auction.currentHighestBid;
    if (bidDifference < auction.minimumIncrement) {
      const requiredMinimumBid = auction.currentHighestBid + auction.minimumIncrement;
      return {
        isValid: false,
        error: 'Bid does not meet minimum increment requirement',
        requiredMinimumBid,
      };
    }

    // Check self-bid prevention: bidder cannot be the current highest bidder
    if (auction.highestBidderId && auction.highestBidderId.toString() === bidderId.toString()) {
      return {
        isValid: false,
        error: 'You are already the highest bidder',
      };
    }

    return {
      isValid: true,
    };
  }, 'validateBid');
}

/**
 * Process a bid with mutex lock to prevent race conditions
 * @param {string} auctionId - Auction ID
 * @param {string} bidderId - Bidder user ID
 * @param {number} bidAmount - Bid amount
 * @returns {Promise<{success: boolean, bid?: Object, error?: string}>}
 */
async function processBid(auctionId, bidderId, bidAmount, bidderName) {
  return withErrorHandling(async () => {
    if (!auctionId || !bidderId || bidAmount === undefined) {
      throw new Error('Missing required parameters: auctionId, bidderId, bidAmount');
    }

    const { Auction, Bid } = getModels();
    if (!Auction || !Bid) {
      throw new Error('Auction or Bid model not available');
    }

    // Acquire mutex lock for this auction
    const mutex = getMutex(auctionId);
    const release = await mutex.acquire();

    try {
      // Validate bid
      const validation = await validateBid(auctionId, bidderId, bidAmount);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate server timestamp
      const serverTimestamp = new Date();

      // Persist bid to database
      const bid = await Bid.create({
        auctionId,
        bidderId,
        bidderName: bidderName || 'Anonymous',
        amount: bidAmount,
        status: 'accepted',
        serverTimestamp,
      });

      // Update auction with new highest bid and bidder
      const auction = await Auction.findOneAndUpdate(
        { roomId: auctionId },
        {
          $set: {
            currentHighestBid: bidAmount,
            highestBidderId: bidderId,
            lastBidTimestamp: serverTimestamp,
          },
        },
        { new: true }
      );

      // Check anti-sniping: if remainingSeconds < 30, extend by 30 seconds
      if (auction.remainingSeconds < 30) {
        auction.remainingSeconds += 30;
        auction.extensionCount = (auction.extensionCount || 0) + 1;
        await auction.save();
      }

      return {
        success: true,
        bid: {
          id: bid._id,
          auctionId: bid.auctionId,
          bidderId: bid.bidderId,
          amount: bid.amount,
          serverTimestamp: bid.serverTimestamp,
        },
      };
    } finally {
      // Always release the mutex lock
      release();
    }
  }, 'processBid');
}

module.exports = {
  getMutex,
  withErrorHandling,
  getModels,
  validateBid,
  processBid,
  startAuction,
  tickTimer,
  pauseAuction,
  resumeAuction,
  endAuction,
  autoCloseRoomOnHostDisconnect,
  getBidHistory,
  getAuctionStateSnapshot,
  AuctionError,
};

/**
 * Start an auction and initialize the countdown timer
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{success: boolean, auction?: Object, error?: string}>}
 */
async function startAuction(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { Auction } = getModels();
    if (!Auction) {
      throw new Error('Auction model not available');
    }

    const auction = await Auction.findOneAndUpdate(
      { roomId: auctionId },
      {
        $set: {
          status: 'active',
          timerStartedAt: new Date(),
        },
      },
      { new: true }
    );

    console.log('[startAuction] findOneAndUpdate result:', auction ? `found, status=${auction.status}, remainingSeconds=${auction.remainingSeconds}` : 'NULL - not found');

    if (!auction) {
      return {
        success: false,
        error: 'Auction not found',
      };
    }

    return {
      success: true,
      auction: {
        auctionId: auction._id,
        status: auction.status,
        remainingSeconds: auction.remainingSeconds,
      },
    };
  }, 'startAuction');
}

/**
 * Tick the auction timer (decrement by 1 second)
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{success: boolean, remainingSeconds?: number, shouldEnd?: boolean}>}
 */
async function tickTimer(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { Auction } = getModels();
    if (!Auction) {
      throw new Error('Auction model not available');
    }

    const auction = await Auction.findOne({ roomId: auctionId });
    if (!auction) {
      return {
        success: false,
        error: 'Auction not found',
      };
    }

    // Decrement remaining seconds
    auction.remainingSeconds = Math.max(0, auction.remainingSeconds - 1);

    // Check if auction should end
    const shouldEnd = auction.remainingSeconds <= 0;
    if (shouldEnd) {
      auction.status = 'ended';
      auction.endedAt = new Date();
    }

    await auction.save();

    return {
      success: true,
      remainingSeconds: auction.remainingSeconds,
      shouldEnd,
    };
  }, 'tickTimer');
}

/**
 * Pause an auction
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{success: boolean, auction?: Object, error?: string}>}
 */
async function pauseAuction(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { Auction } = getModels();
    if (!Auction) {
      throw new Error('Auction model not available');
    }

    const auction = await Auction.findOneAndUpdate(
      { roomId: auctionId },
      {
        $set: {
          status: 'paused',
        },
      },
      { new: true }
    );

    if (!auction) {
      return {
        success: false,
        error: 'Auction not found',
      };
    }

    return {
      success: true,
      auction: {
        auctionId: auction._id,
        status: auction.status,
        remainingSeconds: auction.remainingSeconds,
      },
    };
  }, 'pauseAuction');
}

/**
 * Resume a paused auction
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{success: boolean, auction?: Object, error?: string}>}
 */
async function resumeAuction(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { Auction } = getModels();
    if (!Auction) {
      throw new Error('Auction model not available');
    }

    const auction = await Auction.findOneAndUpdate(
      { roomId: auctionId },
      {
        $set: {
          status: 'active',
        },
      },
      { new: true }
    );

    if (!auction) {
      return {
        success: false,
        error: 'Auction not found',
      };
    }

    return {
      success: true,
      auction: {
        auctionId: auction._id,
        status: auction.status,
        remainingSeconds: auction.remainingSeconds,
      },
    };
  }, 'resumeAuction');
}

/**
 * End an auction and close the room
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{success: boolean, winner?: Object, error?: string}>}
 */
async function endAuction(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { Auction } = getModels();
    if (!Auction) {
      throw new Error('Auction model not available');
    }

    // Get the livekitService to delete the room
    const livekitService = require('./livekitService');

    // Update auction status to ended
    const auction = await Auction.findOneAndUpdate(
      { roomId: auctionId },
      {
        $set: {
          status: 'ended',
          endedAt: new Date(),
        },
      },
      { new: true }
    ).populate('highestBidderId', 'displayName');

    if (!auction) {
      return {
        success: false,
        error: 'Auction not found',
      };
    }

    // Delete the LiveKit room
    try {
      await livekitService.deleteRoom(auctionId);
    } catch (error) {
      console.error('Failed to delete LiveKit room:', error.message);
      // Continue even if room deletion fails
    }

    return {
      success: true,
      winner: auction.highestBidderId ? {
        userId: auction.highestBidderId._id,
        displayName: auction.highestBidderId.displayName,
        finalBid: auction.currentHighestBid,
      } : null,
    };
  }, 'endAuction');
}

/**
 * Auto-close room on host disconnect after grace period
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{success: boolean, gracePeriodMs?: number, error?: string}>}
 */
async function autoCloseRoomOnHostDisconnect(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { HOST_DISCONNECT_GRACE_PERIOD_MS } = require('../../constants');
    const gracePeriodMs = parseInt(HOST_DISCONNECT_GRACE_PERIOD_MS, 10) || 300000;

    const { Auction } = getModels();
    if (!Auction) {
      throw new Error('Auction model not available');
    }

    // Get the livekitService to delete the room
    const livekitService = require('./livekitService');

    // Start grace period timer
    const timeoutId = setTimeout(async () => {
      try {
        // Check if host has reconnected
        const auction = await Auction.findOne({ roomId: auctionId });
        if (auction && auction.status !== 'ended') {
          // Host did not reconnect, close the room
          await livekitService.deleteRoom(auctionId);
          
          // Mark auction as ended
          await Auction.findOneAndUpdate(
            { roomId: auctionId },
            {
              $set: {
                status: 'ended',
                endedAt: new Date(),
              },
            }
          );

          console.log(`[AutoClose] Room closed for auction ${auctionId} after grace period`);
        }
      } catch (error) {
        console.error(`[AutoClose] Failed to auto-close room for auction ${auctionId}:`, error.message);
      }
    }, gracePeriodMs);

    return {
      success: true,
      gracePeriodMs,
    };
  }, 'autoCloseRoomOnHostDisconnect');
}

/**
 * Get paginated bid history for an auction
 * @param {string} auctionId - Auction ID
 * @param {number} limit - Max bids to return (default 50)
 * @param {number} offset - Pagination offset (default 0)
 * @returns {Promise<{bids: Array, total: number, error?: string}>}
 */
async function getBidHistory(auctionId, limit = 50, offset = 0) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { Bid } = getModels();
    if (!Bid) {
      throw new Error('Bid model not available');
    }

    // Query accepted bids, ordered chronologically
    const bids = await Bid.find({ auctionId, status: 'accepted' })
      .sort({ serverTimestamp: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Bid.countDocuments({ auctionId, status: 'accepted' });

    // Format bids for response
    const formattedBids = bids.map(bid => ({
      id: bid._id,
      auctionId: bid.auctionId,
      bidderId: bid.bidderId,
      bidderName: bid.bidderName || bid.bidderId,
      amount: bid.amount,
      serverTimestamp: bid.serverTimestamp,
      status: bid.status,
    }));

    return {
      bids: formattedBids,
      total,
    };
  }, 'getBidHistory');
}

/**
 * Get complete auction state snapshot for late joiners
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{auctionState: Object, error?: string}>}
 */
async function getAuctionStateSnapshot(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    const { Auction, Bid, Participant } = getModels();
    if (!Auction || !Bid || !Participant) {
      throw new Error('Required models not available');
    }

    // Retrieve auction
    const auction = await Auction.findOne({ roomId: auctionId })
      .populate('highestBidderId', 'displayName')
      .lean();

    if (!auction) {
      return {
        auctionState: null,
        error: 'Auction not found',
      };
    }

    // Retrieve all accepted bids
    const bids = await Bid.find({ auctionId, status: 'accepted' })
      .sort({ serverTimestamp: 1 })
      .lean();

    // Retrieve all participants
    const participants = await Participant.find({ auctionId })
      .populate('userId', 'displayName')
      .lean();

    // Format bids
    const formattedBids = bids.map(bid => ({
      id: bid._id,
      bidderId: bid.bidderId,
      bidderName: bid.bidderName || bid.bidderId,
      amount: bid.amount,
      serverTimestamp: bid.serverTimestamp,
    }));

    // Format participants
    const formattedParticipants = participants.map(p => ({
      userId: p.userId._id,
      displayName: p.userId.displayName,
      role: p.role,
      joinedAt: p.joinedAt,
    }));

    return {
      auctionState: {
        auctionId: auction._id,
        status: auction.status,
        currentHighestBid: auction.currentHighestBid,
        highestBidderId: auction.highestBidderId ? auction.highestBidderId._id : null,
        highestBidderName: auction.highestBidderId ? auction.highestBidderId.displayName : null,
        minimumIncrement: auction.minimumIncrement,
        remainingSeconds: auction.remainingSeconds,
        bids: formattedBids,
        participants: formattedParticipants,
      },
    };
  }, 'getAuctionStateSnapshot');
}


module.exports = {
  getMutex,
  withErrorHandling,
  getModels,
  validateBid,
  processBid,
  startAuction,
  tickTimer,
  pauseAuction,
  resumeAuction,
  endAuction,
  autoCloseRoomOnHostDisconnect,
  getBidHistory,
  getAuctionStateSnapshot,
  AuctionError,
};
