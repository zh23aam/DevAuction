const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  startingBid: {
    type: Number,
    required: true,
    min: 0,
  },
  currentHighestBid: {
    type: Number,
    required: true,
    min: 0,
  },
  highestBidderId: {
    type: String,
  },
  minimumIncrement: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'ended'],
    default: 'pending',
  },
  livekitRoomName: {
    type: String,
    unique: true,
    sparse: true,
  },
  livekitRoomClosed: {
    type: Boolean,
    default: false,
  },
  startedAt: Date,
  endedAt: Date,
  originalDurationSeconds: {
    type: Number,
    required: true,
  },
  remainingSeconds: Number,
  timerStartedAt: Date,
  lastBidTimestamp: Date,
  extensionCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Indexes for common queries
auctionSchema.index({ roomId: 1 });
auctionSchema.index({ hostId: 1 });
auctionSchema.index({ status: 1 });
auctionSchema.index({ createdAt: 1 });

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;
