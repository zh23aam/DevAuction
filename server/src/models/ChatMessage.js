const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  auctionId: {
    type: String,
    ref: 'Auction',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  messageText: {
    type: String,
    required: true,
  },
  isSystemMessage: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  serverTimestamp: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Indexes for common queries
chatMessageSchema.index({ auctionId: 1 });
chatMessageSchema.index({ serverTimestamp: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
