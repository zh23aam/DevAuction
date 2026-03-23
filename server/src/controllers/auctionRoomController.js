const livekitService = require('../services/livekitService');
const auctionService = require('../services/auctionService');
const logger = require('../utils/logger');

/**
 * Issue a LiveKit token for a participant
 * POST /api/auctions/:auctionId/token
 */
async function issueToken(req, res) {
  try {
    const { auctionId } = req.params;
    const { userId, role, displayName } = req.body;

    if (!auctionId || !userId || !role) {
      return res.status(400).json({
        error: 'Missing required parameters: auctionId, userId, role',
      });
    }

    const result = await livekitService.issueToken(auctionId, userId, role, displayName);

    res.status(200).json({
      token: result.token,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    logger.error('[AUCTION-TOKEN] Error issuing token:', error);
    res.status(500).json({
      error: 'Failed to issue token',
    });
  }
}

/**
 * Get bid history for an auction
 * GET /api/auctions/:auctionId/bids
 */
async function getBidHistory(req, res) {
  try {
    const { auctionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!auctionId) {
      return res.status(400).json({
        error: 'Missing required parameter: auctionId',
      });
    }

    const result = await auctionService.getBidHistory(
      auctionId,
      parseInt(limit, 10),
      parseInt(offset, 10)
    );

    res.status(200).json({
      bids: result.bids,
      total: result.total,
    });
  } catch (error) {
    logger.error('[AUCTION-BIDS] Error retrieving bid history:', error);
    res.status(500).json({
      error: 'Failed to retrieve bid history',
    });
  }
}

/**
 * Get auction state snapshot
 * GET /api/auctions/:auctionId/state
 */
async function getAuctionState(req, res) {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({
        error: 'Missing required parameter: auctionId',
      });
    }

    const result = await auctionService.getAuctionStateSnapshot(auctionId);

    if (!result.auctionState) {
      return res.status(404).json({
        error: result.error || 'Auction not found',
      });
    }

    res.status(200).json(result.auctionState);
  } catch (error) {
    logger.error('[AUCTION-STATE] Error retrieving auction state:', error);
    res.status(500).json({
      error: 'Failed to retrieve auction state',
    });
  }
}

/**
 * Close a LiveKit room (host only)
 * POST /api/auctions/:auctionId/room/close
 */
async function closeRoom(req, res) {
  try {
    const { auctionId } = req.params;
    const { userId, role } = req.body;

    if (!auctionId) {
      return res.status(400).json({
        error: 'Missing required parameter: auctionId',
      });
    }

    // Verify host role
    if (role !== 'host') {
      return res.status(403).json({
        error: 'Only host can close the room',
      });
    }

    const result = await livekitService.deleteRoom(auctionId);

    res.status(200).json({
      success: result.success,
      deletedAt: result.deletedAt,
    });
  } catch (error) {
    logger.error('[AUCTION-CLOSE] Error closing room:', error);
    res.status(500).json({
      error: 'Failed to close room',
    });
  }
}

module.exports = {
  issueToken,
  getBidHistory,
  getAuctionState,
  closeRoom,
};
