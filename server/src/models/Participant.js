const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  auctionId: {
    type: String,
    ref: 'Auction',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['host', 'bidder', 'observer'],
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: Date,
  isMuted: {
    type: Boolean,
    default: false,
  },
  connectionQuality: {
    type: String,
    enum: ['excellent', 'good', 'poor', 'unknown'],
    default: 'unknown',
  },
}, { timestamps: true });

// Indexes for common queries
participantSchema.index({ auctionId: 1 });
participantSchema.index({ userId: 1 });

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;
