const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auctionId: {
    type: String,
    ref: 'Auction',
    required: true,
  },
  bidderId: {
    type: String,
    required: true,
  },
  bidderName: {
    type: String,
    default: 'Anonymous',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['accepted', 'rejected'],
    default: 'accepted',
  },
  rejectionReason: String,
  serverTimestamp: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Indexes for common queries
bidSchema.index({ auctionId: 1 });
bidSchema.index({ bidderId: 1 });
bidSchema.index({ serverTimestamp: 1 });

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;
