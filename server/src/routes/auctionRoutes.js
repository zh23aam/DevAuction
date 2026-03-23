const express = require('express');
const router = express.Router();
const auctionRoomController = require('../controllers/auctionRoomController');

/**
 * POST /api/auctions/:auctionId/token
 * Issue a LiveKit token for a participant
 * Requires: JWT authentication
 */
router.post('/:auctionId/token', auctionRoomController.issueToken);

/**
 * GET /api/auctions/:auctionId/bids
 * Get paginated bid history for an auction
 * Query params: limit (default 50), offset (default 0)
 * Public after auction ends; requires JWT during active auction
 */
router.get('/:auctionId/bids', auctionRoomController.getBidHistory);

/**
 * GET /api/auctions/:auctionId/state
 * Get complete auction state snapshot
 * Requires: JWT authentication
 */
router.get('/:auctionId/state', auctionRoomController.getAuctionState);

/**
 * POST /api/auctions/:auctionId/room/close
 * Close a LiveKit room (host only)
 * Requires: JWT authentication, host role
 */
router.post('/:auctionId/room/close', auctionRoomController.closeRoom);

// GET /api/auctions/:auctionId/summary
router.get('/:auctionId/summary', async (req, res) => {
  try {
    const { auctionId } = req.params;
    const Auction = require('../models/Auction');
    const Bid = require('../models/Bid');
    const Room = require('../models/createRoom');

    const [auction, room, bids] = await Promise.all([
      Auction.findOne({ roomId: auctionId }),
      Room.findOne({ RoomID: auctionId }),
      Bid.find({ auctionId, status: 'accepted' }).sort({ serverTimestamp: 1 }),
    ]);

    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    // Winner is the last accepted bid (highest)
    const winningBid = bids.length > 0 ? bids[bids.length - 1] : null;

    // Use bidderName if stored, otherwise fall back to bidderId (Auth0 sub)
    // Then try to get display name from User model using Auth0 sub
    let winnerName = winningBid?.bidderName || null;
    if (!winnerName && winningBid?.bidderId) {
      const User = require('../models/user');
      const user = await User.findOne({ 'UserInfo.sub': winningBid.bidderId })
        .select('UserInfo.name UserInfo.email Profile.name')
        .lean();
      winnerName = user?.UserInfo?.name
        || user?.UserInfo?.email
        || winningBid.bidderId;
    }

    const formattedBids = await Promise.all(bids.map(async (bid) => {
      let bidderName = bid.bidderName || null;
      if (!bidderName && bid.bidderId) {
        const User = require('../models/user');
        const user = await User.findOne({ 'UserInfo.sub': bid.bidderId })
          .select('UserInfo.name UserInfo.email Profile.name')
          .lean();
        bidderName = user?.UserInfo?.name
          || user?.UserInfo?.email
          || bid.bidderId;
      }
      return {
        id: bid._id,
        bidderId: bid.bidderId,
        bidderName: bidderName || 'Anonymous',
        amount: bid.amount,
        serverTimestamp: bid.serverTimestamp,
      };
    }));

    res.json({
      title: room?.Title || auction.title,
      description: room?.Description || auction.description,
      imgSrc: room?.Image || null,
      owner: room?.Owner || null,
      date: room?.Time || null,
      status: auction.status,
      winnerName,
      winnerBid: auction.currentHighestBid || 0,
      totalBids: bids.length,
      startingBid: auction.startingBid,
      minimumIncrement: auction.minimumIncrement,
      duration: auction.originalDurationSeconds,
      bids: formattedBids,
    });
  } catch (err) {
    console.error('[AUCTION-SUMMARY]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
