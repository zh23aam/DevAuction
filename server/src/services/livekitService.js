const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = require('../../constants');

/**
 * LiveKit Service
 * Utility module for LiveKit API interactions
 * Called by controllers to manage video rooms and tokens
 */

// Validate required environment variables on module load
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
  throw new Error(
    'Missing required LiveKit environment variables: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL'
  );
}

/**
 * Error wrapper for LiveKit API calls
 * Catches and logs errors without exposing sensitive credentials
 */
class LiveKitError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'LiveKitError';
    // Log error details for debugging (without credentials)
    console.error(`[LiveKitError] ${message}`, {
      errorType: originalError?.name,
      errorMessage: originalError?.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Wrapper for safe error handling in LiveKit operations
 * @param {Function} operation - Async function to execute
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise} Result of operation or throws LiveKitError
 */
async function withErrorHandling(operation, operationName) {
  try {
    return await operation();
  } catch (error) {
    throw new LiveKitError(
      `LiveKit ${operationName} failed: ${error.message}`,
      error
    );
  }
}

/**
 * Create a LiveKit room for an auction
 * @param {string} auctionId - Auction ID (used to derive room name)
 * @param {string} roomName - Desired room name
 * @returns {Promise<{roomName: string, createdAt: Date}>}
 */
async function createRoom(auctionId, roomName) {
  return withErrorHandling(async () => {
    if (!auctionId || typeof auctionId !== 'string') {
      throw new Error('Invalid auction ID');
    }

    if (!roomName || typeof roomName !== 'string') {
      throw new Error('Invalid room name');
    }

    // Initialize RoomServiceClient to interact with LiveKit API
    const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    // Create room with max 6 participants
    const room = await roomService.createRoom({
      name: roomName,
      maxParticipants: 6,
      emptyTimeout: 300, // Auto-delete room after 5 minutes of being empty
    });

    return {
      roomName: room.name,
      createdAt: new Date(),
    };
  }, 'createRoom');
}

/**
 * Issue a scoped LiveKit token for a participant
 * @param {string} auctionId - Auction ID
 * @param {string} userId - User ID
 * @param {string} role - Participant role ('host', 'bidder', 'observer')
 * @param {string} displayName - Display name for the participant
 * @returns {Promise<{token: string, expiresAt: Date}>}
 */
async function issueToken(auctionId, userId, role, displayName) {
  return withErrorHandling(async () => {
    if (!auctionId || !userId || !role) {
      throw new Error('Missing required parameters: auctionId, userId, role');
    }

    if (!['host', 'bidder', 'observer'].includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Derive room name from auction ID
    const roomName = `auction-${auctionId}`;

    // Create access token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: displayName || userId,
      ttl: '6h',
      metadata: JSON.stringify({
        userId,
        role,
        auctionId,
      }),
    });

    // Set permissions based on role
    const canPublish = role === 'host' || role === 'bidder';
    const canPublishData = role === 'host';
    const isRoomAdmin = role === 'host';

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish,
      canPublishData,
      canSubscribe: true,
      roomAdmin: isRoomAdmin,
    });

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);

    return {
      token: await token.toJwt(),
      expiresAt,
    };
  }, 'issueToken');
}

/**
 * Delete a LiveKit room
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{success: boolean, deletedAt: Date}>}
 */
async function deleteRoom(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    // Derive room name from auction ID
    const roomName = `auction-${auctionId}`;

    // Initialize RoomServiceClient to interact with LiveKit API
    const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    // Delete room from LiveKit (disconnects all participants)
    await roomService.deleteRoom(roomName);

    return {
      success: true,
      deletedAt: new Date(),
    };
  }, 'deleteRoom');
}

/**
 * Get participants in a LiveKit room
 * @param {string} auctionId - Auction ID
 * @returns {Promise<Array>} Array of participant objects with userId, displayName, role, joinedAt
 */
async function getParticipants(auctionId) {
  return withErrorHandling(async () => {
    if (!auctionId) {
      throw new Error('Missing required parameter: auctionId');
    }

    // Dynamically require Participant model to avoid circular dependencies
    // This will be available after task 1.19 creates the model
    try {
      const Participant = require('../models/Participant');
      const participants = await Participant.find({ auctionId })
        .populate('userId', 'displayName')
        .lean();

      return participants.map(p => ({
        userId: p.userId._id,
        displayName: p.userId.displayName,
        role: p.role,
        joinedAt: p.joinedAt,
      }));
    } catch (error) {
      // If Participant model doesn't exist yet, return empty array
      // This allows the service to be used before the model is created
      if (error.code === 'MODULE_NOT_FOUND') {
        return [];
      }
      throw error;
    }
  }, 'getParticipants');
}

module.exports = {
  createRoom,
  issueToken,
  deleteRoom,
  getParticipants,
  LiveKitError,
};
