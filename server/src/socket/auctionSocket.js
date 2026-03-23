const { verifyAuth0Token } = require('../utils/auth0Verify');
const logger = require('../utils/logger');

/**
 * Set up Socket.io auction namespace with JWT authentication
 * @param {Object} io - Socket.io instance
 */
function setupAuctionSocket(io) {
  // Create auction namespace
  const auctionNamespace = io.of('/auction');

  /**
   * Helper function to insert system message
   */
  async function insertSystemMessage(auctionId, messageText) {
    try {
      const auctionService = require('../services/auctionService');
      const { ChatMessage } = auctionService.getModels();

      if (!ChatMessage) {
        return;
      }

      const message = await ChatMessage.create({
        auctionId,
        senderId: null, // System message has no sender
        messageText,
        isSystemMessage: true,
        serverTimestamp: new Date(),
      });

      // Broadcast system message to auction room
      auctionNamespace.emit('chat:messageReceived', {
        id: message._id,
        auctionId,
        senderId: null,
        senderName: 'System',
        messageText,
        isSystemMessage: true,
        serverTimestamp: message.serverTimestamp,
      });
    } catch (error) {
      logger.error('[AUCTION-SOCKET] Error inserting system message:', error.message);
    }
  }

  /**
   * JWT authentication middleware for Socket.io
   * Validates Auth0 RS256 JWT token and extracts user context
   */
  auctionNamespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      logger.debug('[AUCTION-SOCKET] Token received (first 20 chars):', token ? token.substring(0, 20) : 'NO TOKEN');

      if (!token) {
        logger.warn('[AUCTION-SOCKET] Connection attempt without token');
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify Auth0 RS256 token
      verifyAuth0Token(token, (err, decoded) => {
        if (err) {
          logger.warn('[AUCTION-SOCKET] Authentication failed:', err.message || err.name || JSON.stringify(err));
          return next(new Error(`Authentication error: ${err.message}`));
        }

        // Store user context on socket object
        // Auth0 subject claim is at decoded.sub
        socket.userId = decoded.sub;
        socket.role = socket.handshake.auth.role || 'bidder';
        socket.auctionId = socket.handshake.auth.auctionId;

        logger.info('[AUCTION-SOCKET] User authenticated', {
          userId: socket.userId,
          role: socket.role,
          auctionId: socket.auctionId,
        });

        next();
      });
    } catch (error) {
      logger.warn('[AUCTION-SOCKET] Authentication error:', error.message);
      next(new Error(`Authentication error: ${error.message}`));
    }
  });

  /**
   * Handle socket connection
   */
  auctionNamespace.on('connection', (socket) => {
    logger.info('[AUCTION-SOCKET] User connected', {
      socketId: socket.id,
      userId: socket.userId,
      auctionId: socket.auctionId,
    });

    /**
     * Send state snapshot to late joiner immediately upon connection
     */
    (async () => {
      try {
        const auctionService = require('../services/auctionService');
        const result = await auctionService.getAuctionStateSnapshot(socket.auctionId);

        if (result.auctionState) {
          // Send state snapshot before any other events
          socket.emit('auction:stateSnapshot', result.auctionState);

          // Send chat history (last 50 messages)
          const { ChatMessage } = auctionService.getModels();
          if (ChatMessage) {
            const messages = await ChatMessage.find({ auctionId: socket.auctionId })
              .populate('senderId', 'displayName')
              .sort({ serverTimestamp: -1 })
              .limit(50)
              .lean();

            const formattedMessages = messages.reverse().map(msg => ({
              id: msg._id,
              auctionId: msg.auctionId,
              senderId: msg.senderId ? msg.senderId._id : null,
              senderName: msg.senderId ? msg.senderId.displayName : 'System',
              messageText: msg.messageText,
              isSystemMessage: msg.isSystemMessage,
              isDeleted: msg.isDeleted,
              serverTimestamp: msg.serverTimestamp,
            }));

            socket.emit('chat:history', {
              messages: formattedMessages,
            });
          }

          logger.info('[AUCTION-SOCKET] State snapshot sent to late joiner', {
            auctionId: socket.auctionId,
            userId: socket.userId,
          });

          // Check if host is already in the room
          const allSockets = await auctionNamespace.fetchSockets();
          const hostAlreadyPresent = allSockets.some(
            s => s.handshake?.auth?.role === 'host' &&
                 s.handshake?.auth?.auctionId === socket.auctionId &&
                 s.id !== socket.id
          );
          if (hostAlreadyPresent) {
            socket.emit('host:joined', { auctionId: socket.auctionId });
          }

          // Insert system message for participant join
          await insertSystemMessage(socket.auctionId, `${socket.handshake.auth.displayName || 'A participant'} joined the auction`);
        }
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error sending state snapshot:', error.message);
      }
    })();

    // Notify room if host joins
    if (socket.role === 'host') {
      auctionNamespace.emit('host:joined', { auctionId: socket.auctionId });
      logger.info('[AUCTION-SOCKET] Host joined room', { auctionId: socket.auctionId });

      // Auto-resume timer if auction was paused due to host disconnect
      (async () => {
        try {
          const auctionService = require('../services/auctionService');
          const { Auction } = auctionService.getModels();
          if (Auction) {
            const auction = await Auction.findOne({ roomId: socket.auctionId });
            if (auction && auction.status === 'paused') {
              await auctionService.resumeAuction(socket.auctionId);
              startTimerInterval(socket.auctionId);
              auctionNamespace.emit('auction:resumed', {
                auctionId: socket.auctionId,
                status: 'active',
                remainingSeconds: auction.remainingSeconds,
                reason: 'host_reconnected',
              });
              logger.info('[AUCTION-SOCKET] Timer auto-resumed - host reconnected', { auctionId: socket.auctionId });
            }
          }
        } catch (err) {
          logger.error('[AUCTION-SOCKET] Failed to auto-resume on host reconnect:', err.message);
        }
      })();
    }

    /**
     * Handle socket disconnection
     */
    socket.on('disconnect', async () => {
      logger.info('[AUCTION-SOCKET] User disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        auctionId: socket.auctionId,
      });

      // Notify room if host leaves
      if (socket.role === 'host') {
        auctionNamespace.emit('host:left', { auctionId: socket.auctionId });
        logger.info('[AUCTION-SOCKET] Host left room', { auctionId: socket.auctionId });

        // Auto-pause timer if auction is active
        try {
          const auctionService = require('../services/auctionService');
          const { Auction } = auctionService.getModels();
          if (Auction) {
            const auction = await Auction.findOne({ roomId: socket.auctionId });
            if (auction && auction.status === 'active') {
              stopTimerInterval(socket.auctionId);
              await auctionService.pauseAuction(socket.auctionId);
              auctionNamespace.emit('auction:paused', {
                auctionId: socket.auctionId,
                status: 'paused',
                remainingSeconds: auction.remainingSeconds,
                reason: 'host_disconnected',
              });
              logger.info('[AUCTION-SOCKET] Timer auto-paused - host disconnected', { auctionId: socket.auctionId });
            }
          }
        } catch (err) {
          logger.error('[AUCTION-SOCKET] Failed to auto-pause on host disconnect:', err.message);
        }
      }

      // Insert system message for participant leave
      await insertSystemMessage(socket.auctionId, `${socket.handshake.auth.displayName || 'A participant'} left the auction`);
    });

    /**
     * Handle connection errors
     */
    socket.on('error', (error) => {
      logger.error('[AUCTION-SOCKET] Socket error:', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    });

    /**
     * Handle bid:submit event
     * Validates and processes bid, broadcasts result to all participants
     */
    socket.on('bid:submit', async (data) => {
      try {
        const bidAmount = data.amount ?? data.bidAmount;
        const { auctionId, userId } = socket;

        logger.info('[AUCTION-SOCKET] Bid submitted', {
          auctionId,
          userId,
          bidAmount,
        });

        // Import auctionService here to avoid circular dependencies
        const auctionService = require('../services/auctionService');

        // Process bid with mutex lock
        const result = await auctionService.processBid(
          auctionId,
          userId,
          bidAmount,
          socket.handshake.auth.displayName || 'Anonymous'
        );

        if (result.success) {
          // Broadcast bid:accepted to all participants in the auction room
          auctionNamespace.emit('bid:accepted', {
            bid: result.bid,
            bidderName: socket.handshake.auth.displayName || 'Anonymous',
          });

          // Insert system message for bid
          await insertSystemMessage(socket.auctionId, `${socket.handshake.auth.displayName || 'A bidder'} bid ${result.bid.amount}`);

          logger.info('[AUCTION-SOCKET] Bid accepted', {
            auctionId,
            userId,
            bidAmount,
          });
        } else {
          // Send bid:rejected to submitter only
          socket.emit('bid:rejected', {
            reason: result.error,
            requiredMinimumBid: result.requiredMinimumBid,
          });

          logger.warn('[AUCTION-SOCKET] Bid rejected', {
            auctionId,
            userId,
            bidAmount,
            reason: result.error,
          });
        }
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error processing bid:', error.message);
        socket.emit('bid:rejected', {
          reason: 'Internal server error',
        });
      }
    });

    /**
     * Handle auction:start event (host only)
     */
    socket.on('auction:start', async () => {
      try {
        console.log('START EVENT - role:', socket.role, 'userId:', socket.userId, 'auctionId:', socket.auctionId);
        logger.warn('[AUCTION-SOCKET] auction:start event received', {
          socketId: socket.id,
          userId: socket.userId,
          role: socket.role,
          auctionId: socket.auctionId,
        });

        if (socket.role !== 'host') {
          logger.warn('[AUCTION-SOCKET] Non-host attempted to start auction', {
            socketId: socket.id,
            userId: socket.userId,
            role: socket.role,
            auctionId: socket.auctionId,
          });
          socket.emit('error', { message: 'Only host can start auction' });
          return;
        }

        const auctionService = require('../services/auctionService');
        const result = await auctionService.startAuction(socket.auctionId);

        if (result.success) {
          auctionNamespace.emit('auction:started', {
            auctionId: socket.auctionId,
            status: result.auction.status,
            remainingSeconds: result.auction.remainingSeconds,
          });

          // Start the countdown timer
          startTimerInterval(socket.auctionId);

          // Insert system message for auction start
          await insertSystemMessage(socket.auctionId, 'Auction started');

          logger.info('[AUCTION-SOCKET] Auction started', {
            auctionId: socket.auctionId,
          });
        }
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error starting auction:', error.message);
        socket.emit('error', { message: 'Failed to start auction' });
      }
    });

    /**
     * Handle auction:pause event (host only)
     */
    socket.on('auction:pause', async () => {
      try {
        if (socket.role !== 'host') {
          socket.emit('error', { message: 'Only host can pause auction' });
          return;
        }

        const auctionService = require('../services/auctionService');
        const result = await auctionService.pauseAuction(socket.auctionId);

        if (result.success) {
          stopTimerInterval(socket.auctionId);
          auctionNamespace.emit('auction:paused', {
            auctionId: socket.auctionId,
            status: result.auction.status,
            remainingSeconds: result.auction.remainingSeconds,
          });

          logger.info('[AUCTION-SOCKET] Auction paused', {
            auctionId: socket.auctionId,
          });
        }
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error pausing auction:', error.message);
        socket.emit('error', { message: 'Failed to pause auction' });
      }
    });

    /**
     * Handle auction:resume event (host only)
     */
    socket.on('auction:resume', async () => {
      try {
        if (socket.role !== 'host') {
          socket.emit('error', { message: 'Only host can resume auction' });
          return;
        }

        const auctionService = require('../services/auctionService');
        const result = await auctionService.resumeAuction(socket.auctionId);

        if (result.success) {
          startTimerInterval(socket.auctionId);
          auctionNamespace.emit('auction:resumed', {
            auctionId: socket.auctionId,
            status: result.auction.status,
            remainingSeconds: result.auction.remainingSeconds,
          });

          logger.info('[AUCTION-SOCKET] Auction resumed', {
            auctionId: socket.auctionId,
          });
        }
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error resuming auction:', error.message);
        socket.emit('error', { message: 'Failed to resume auction' });
      }
    });

    /**
     * Handle auction:end event (host only)
     */
    socket.on('auction:end', async () => {
      try {
        if (socket.role !== 'host') {
          socket.emit('error', { message: 'Only host can end auction' });
          return;
        }

        const auctionService = require('../services/auctionService');
        const result = await auctionService.endAuction(socket.auctionId);

        if (result.success) {
          // Mark room as ended in rooms collection
          const Room = require('../models/createRoom');
          await Room.findOneAndUpdate(
            { RoomID: socket.auctionId },
            { $set: { Status: true } }
          );

          auctionNamespace.emit('auction:ended', {
            auctionId: socket.auctionId,
            winner: result.winner,
          });

          // Insert system message for auction end
          const winnerName = result.winner ? result.winner.displayName : 'No winner';
          const finalBid = result.winner ? result.winner.finalBid : 0;
          await insertSystemMessage(socket.auctionId, `Auction ended - ${winnerName} won with bid ${finalBid}`);

          logger.info('[AUCTION-SOCKET] Auction ended', {
            auctionId: socket.auctionId,
            winner: result.winner,
          });
        }
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error ending auction:', error.message);
        socket.emit('error', { message: 'Failed to end auction' });
      }
    });

    /**
     * Handle chat:message event
     * Persists message to database and broadcasts to auction room
     */
    socket.on('chat:message', async (data) => {
      try {
        const { messageText } = data;
        const { auctionId, userId } = socket;

        if (!messageText || messageText.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        const auctionService = require('../services/auctionService');
        const { ChatMessage } = auctionService.getModels();

        if (!ChatMessage) {
          socket.emit('error', { message: 'Chat service unavailable' });
          return;
        }

        // Persist message to database
        const message = await ChatMessage.create({
          auctionId,
          senderId: userId,
          messageText,
          isSystemMessage: false,
          serverTimestamp: new Date(),
        });

        // Broadcast to auction room
        auctionNamespace.emit('chat:messageReceived', {
          id: message._id,
          auctionId,
          senderId: userId,
          senderName: socket.handshake.auth.displayName || 'Anonymous',
          messageText,
          serverTimestamp: message.serverTimestamp,
        });

        logger.info('[AUCTION-SOCKET] Chat message sent', {
          auctionId,
          userId,
          messageLength: messageText.length,
        });
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error sending chat message:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Handle chat:delete event (host only)
     */
    socket.on('chat:delete', async (data) => {
      try {
        if (socket.role !== 'host') {
          socket.emit('error', { message: 'Only host can delete messages' });
          return;
        }

        const { messageId } = data;
        const { auctionId } = socket;

        const auctionService = require('../services/auctionService');
        const { ChatMessage } = auctionService.getModels();

        if (!ChatMessage) {
          socket.emit('error', { message: 'Chat service unavailable' });
          return;
        }

        // Mark message as deleted
        await ChatMessage.findByIdAndUpdate(messageId, {
          $set: {
            isDeleted: true,
            deletedByUserId: socket.userId,
          },
        });

        // Broadcast deletion to auction room
        auctionNamespace.emit('chat:deleted', {
          messageId,
          auctionId,
        });

        logger.info('[AUCTION-SOCKET] Chat message deleted', {
          auctionId,
          messageId,
          deletedBy: socket.userId,
        });
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error deleting chat message:', error.message);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    /**
     * Handle chat:reaction event
     * Broadcasts reaction to auction room (not persisted)
     */
    socket.on('chat:reaction', (data) => {
      try {
        const { emoji } = data;
        const { auctionId, userId } = socket;

        if (!emoji) {
          socket.emit('error', { message: 'Emoji is required' });
          return;
        }

        // Broadcast reaction to auction room (ephemeral, not persisted)
        auctionNamespace.emit('chat:reactionReceived', {
          emoji,
          auctionId,
          userId,
          senderName: socket.handshake.auth.displayName || 'Anonymous',
          timestamp: new Date(),
        });

        logger.info('[AUCTION-SOCKET] Chat reaction sent', {
          auctionId,
          userId,
          emoji,
        });
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error sending reaction:', error.message);
        socket.emit('error', { message: 'Failed to send reaction' });
      }
    });
  });

  /**
   * Set up timer tick interval
   * Emits auction:tick every 1 second to all participants
   */
  const timerIntervals = new Map();

  function startTimerInterval(auctionId) {
    if (timerIntervals.has(auctionId)) {
      return; // Interval already running
    }

    const intervalId = setInterval(async () => {
      try {
        const auctionService = require('../services/auctionService');
        const result = await auctionService.tickTimer(auctionId);

        if (result.success) {
          // Emit tick to all participants
          auctionNamespace.emit('auction:tick', {
            auctionId,
            remainingSeconds: result.remainingSeconds,
            shouldEnd: result.shouldEnd,
          });

          // If auction should end, stop the interval
          if (result.shouldEnd) {
            clearInterval(intervalId);
            timerIntervals.delete(auctionId);
            logger.info('[AUCTION-SOCKET] Timer interval stopped', { auctionId });
          }
        }
      } catch (error) {
        logger.error('[AUCTION-SOCKET] Error in timer tick:', error.message);
      }
    }, 1000); // Tick every 1 second

    timerIntervals.set(auctionId, intervalId);
    logger.info('[AUCTION-SOCKET] Timer interval started', { auctionId });
  }

  function stopTimerInterval(auctionId) {
    if (timerIntervals.has(auctionId)) {
      clearInterval(timerIntervals.get(auctionId));
      timerIntervals.delete(auctionId);
      logger.info('[AUCTION-SOCKET] Timer interval stopped', { auctionId });
    }
  }

  // Expose timer control functions
  auctionNamespace.startTimer = startTimerInterval;
  auctionNamespace.stopTimer = stopTimerInterval;

  return auctionNamespace;
}

module.exports = {
  setupAuctionSocket,
};
