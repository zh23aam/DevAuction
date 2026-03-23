import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../utils/api';
import { useAuction } from '../context/AuctionContext';
import { useChat } from '../context/ChatContext';

/**
 * useSocketAuction hook
 * Manages Socket.io connection for auction events (bidding, chat, timer)
 * Handles JWT authentication, event listeners, and event emitters
 */
export function useSocketAuction(auctionId, userRole) {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();

  const {
    setAuctionStatus,
    setHighestBid,
    addBid,
    setRemainingSeconds,
    addError,
  } = useAuction();

  const {
    addMessage,
    deleteMessage,
    setMessageHistory,
    addReaction,
  } = useChat();

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isHostPresent, setIsHostPresent] = useState(false);

  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(3);
  const reconnectDelaysRef = useRef([1000, 2000, 4000]); // 1s, 2s, 4s

  /**
   * Connect to Socket.io auction namespace with JWT
   */
  const connectSocket = useCallback(async () => {
    try {
      const auth0Token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });
      console.log('[useSocketAuction] Got auth token (first 20):', auth0Token?.substring(0, 20));

      if (!auth0Token) {
        console.warn('[useSocketAuction] No auth token available, aborting connection');
        return;
      }

      // Disconnect existing socket before creating new one
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_WEB_SERVER_URL || 'http://localhost:3000';

      const socket = io(`${socketUrl}/auction`, {
        auth: {
          token: auth0Token,
          auctionId,
          role: userRole,
          displayName: user?.name || 'Anonymous',
        },
        reconnection: false,
      });

      // Connection established
      socket.on('connect', () => {
        console.log('[useSocketAuction] Connected to auction namespace');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      });

      // Connection error
      socket.on('connection:error', (data) => {
        console.error('[useSocketAuction] Connection error:', data);
        setError(data.error || 'Connection error');
        addError(data.error || 'Connection error');
      });

      // Generic error
      socket.on('error', (errorData) => {
        console.error('[useSocketAuction] Socket error:', errorData);
        setError(errorData.message || 'Socket error');
        addError(errorData.message || 'Socket error');
      });

      // Disconnected
      socket.on('disconnect', () => {
        console.log('[useSocketAuction] Disconnected from auction namespace');
        setIsConnected(false);
      });

      // ===== AUCTION STATE SNAPSHOT (Late Joiner) =====
      socket.on('auction:stateSnapshot', (snapshot) => {
        console.log('[useSocketAuction] Received state snapshot:', snapshot);
        
        // Initialize auction state from snapshot
        setAuctionStatus(snapshot.status);
        setHighestBid(
          snapshot.currentHighestBid,
          snapshot.highestBidderId,
          snapshot.highestBidderName
        );
        setRemainingSeconds(snapshot.remainingSeconds);

        // Add all bids from snapshot
        if (snapshot.bids && Array.isArray(snapshot.bids)) {
          snapshot.bids.forEach(bid => {
            addBid({
              id: bid.id,
              auctionId: bid.auctionId,
              bidderId: bid.bidderId,
              bidderName: bid.bidderName,
              amount: bid.amount,
              status: bid.status,
              serverTimestamp: new Date(bid.serverTimestamp),
            });
          });
        }
      });

      // ===== AUCTION EVENTS =====

      // Auction started
      socket.on('auction:started', (data) => {
        console.log('[useSocketAuction] Auction started:', data);
        setAuctionStatus('active');
        setRemainingSeconds(data.remainingSeconds);
      });

      // Auction paused
      socket.on('auction:paused', (data) => {
        console.log('[useSocketAuction] Auction paused:', data);
        setAuctionStatus('paused');
        setRemainingSeconds(data.remainingSeconds);
      });

      // Auction resumed
      socket.on('auction:resumed', (data) => {
        console.log('[useSocketAuction] Auction resumed:', data);
        setAuctionStatus('active');
        setRemainingSeconds(data.remainingSeconds);
      });

      // Auction ended
      socket.on('auction:ended', (data) => {
        console.log('[useSocketAuction] Auction ended:', data);
        setAuctionStatus('ended');
        if (data.winner) {
          addMessage({
            id: `system-${Date.now()}`,
            auctionId,
            senderId: null,
            senderName: 'System',
            messageText: `Auction ended - ${data.winner.displayName} won with bid ${data.winner.finalBid}`,
            isSystemMessage: true,
            serverTimestamp: new Date(),
          });
        }
      });

      // Auction tick (timer update)
      socket.on('auction:tick', (data) => {
        console.log('[useSocketAuction] Auction tick:', data.remainingSeconds);
        setRemainingSeconds(data.remainingSeconds);
      });

      // ===== BIDDING EVENTS =====

      // Bid accepted
      socket.on('bid:accepted', (data) => {
        console.log('[useSocketAuction] Bid accepted:', data);
        
        const bid = data.bid;
        addBid({
          id: bid.id,
          auctionId: bid.auctionId,
          bidderId: bid.bidderId,
          bidderName: data.bidderName || bid.bidderName,
          amount: bid.amount,
          status: 'accepted',
          serverTimestamp: new Date(bid.serverTimestamp),
        });

        // Update highest bid
        setHighestBid(
          bid.amount,
          bid.bidderId,
          data.bidderName || bid.bidderName
        );
      });

      // Bid rejected
      socket.on('bid:rejected', (data) => {
        console.error('[useSocketAuction] Bid rejected:', data);
        const message = data.reason || 'Bid rejected';
        const fullMessage = data.requiredMinimumBid
          ? `${message}. Minimum bid required: ${data.requiredMinimumBid}`
          : message;
        
        setError(fullMessage);
        addError(fullMessage);
      });

      // ===== CHAT EVENTS =====

      // Chat history (late joiner)
      socket.on('chat:history', (data) => {
        console.log('[useSocketAuction] Received chat history:', data.messages.length);
        
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map(msg => ({
            id: msg.id,
            auctionId: msg.auctionId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            messageText: msg.messageText,
            isSystemMessage: msg.isSystemMessage,
            isDeleted: msg.isDeleted,
            serverTimestamp: new Date(msg.serverTimestamp),
          }));
          setMessageHistory(formattedMessages);
        }
      });

      // Chat message received
      socket.on('chat:messageReceived', (data) => {
        console.log('[useSocketAuction] Chat message received:', data);
        
        addMessage({
          id: data.id,
          auctionId: data.auctionId,
          senderId: data.senderId,
          senderName: data.senderName,
          messageText: data.messageText,
          isSystemMessage: data.isSystemMessage || false,
          isDeleted: data.isDeleted || false,
          serverTimestamp: new Date(data.serverTimestamp),
        });
      });

      // Chat message deleted
      socket.on('chat:deleted', (data) => {
        console.log('[useSocketAuction] Chat message deleted:', data.messageId);
        deleteMessage(data.messageId);
      });

      // Chat reaction received
      socket.on('chat:reactionReceived', (data) => {
        console.log('[useSocketAuction] Chat reaction received:', data);
        
        addReaction({
          id: `reaction-${Date.now()}-${Math.random()}`,
          emoji: data.emoji,
          senderName: data.senderName,
          senderUserId: data.userId,
          createdAt: new Date(data.timestamp),
          expiresAt: new Date(new Date(data.timestamp).getTime() + 2000), // 2 seconds
        });
      });

      // Host joined
      socket.on('host:joined', () => {
        console.log('[useSocketAuction] Host joined');
        setIsHostPresent(true);
      });

      // Host left
      socket.on('host:left', () => {
        console.log('[useSocketAuction] Host left');
        setIsHostPresent(false);
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('[useSocketAuction] Connection error:', err);
      setError(err.message);
      addError(err.message);
    }
  }, [auctionId, getAccessTokenSilently, user, setAuctionStatus, setHighestBid, addBid, setRemainingSeconds, addMessage, deleteMessage, setMessageHistory, addReaction, addError]);

  /**
   * Submit bid
   */
  const submitBid = useCallback((bidAmount) => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Submitting bid:', bidAmount);
    socketRef.current.emit('bid:submit', {
      auctionId,
      amount: bidAmount,
    });
  }, [auctionId, addError]);

  /**
   * Start auction (host only)
   */
  const startAuction = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    if (userRole !== 'host') {
      const errorMsg = 'Only host can start auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Starting auction');
    socketRef.current.emit('auction:start', { auctionId });
  }, [auctionId, userRole, addError]);

  /**
   * Pause auction (host only)
   */
  const pauseAuction = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    if (userRole !== 'host') {
      const errorMsg = 'Only host can pause auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Pausing auction');
    socketRef.current.emit('auction:pause', { auctionId });
  }, [auctionId, userRole, addError]);

  /**
   * Resume auction (host only)
   */
  const resumeAuction = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    if (userRole !== 'host') {
      const errorMsg = 'Only host can resume auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Resuming auction');
    socketRef.current.emit('auction:resume', { auctionId });
  }, [auctionId, userRole, addError]);

  /**
   * End auction (host only)
   */
  const endAuction = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    if (userRole !== 'host') {
      const errorMsg = 'Only host can end auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Ending auction');
    socketRef.current.emit('auction:end', { auctionId });
  }, [auctionId, userRole, addError]);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((messageText) => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    if (!messageText || messageText.trim().length === 0) {
      const errorMsg = 'Message cannot be empty';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Sending message:', messageText);
    socketRef.current.emit('chat:message', {
      auctionId,
      messageText: messageText.trim(),
    });
  }, [auctionId, addError]);

  /**
   * Delete chat message (host only)
   */
  const deleteMessageHandler = useCallback((messageId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    if (userRole !== 'host') {
      const errorMsg = 'Only host can delete messages';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Deleting message:', messageId);
    socketRef.current.emit('chat:delete', {
      auctionId,
      messageId,
    });
  }, [auctionId, userRole, addError]);

  /**
   * Send emoji reaction
   */
  const sendReaction = useCallback((emoji) => {
    if (!socketRef.current || !socketRef.current.connected) {
      const errorMsg = 'Not connected to auction';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    if (!emoji) {
      const errorMsg = 'Emoji is required';
      setError(errorMsg);
      addError(errorMsg);
      return;
    }

    console.log('[useSocketAuction] Sending reaction:', emoji);
    socketRef.current.emit('chat:reaction', {
      auctionId,
      emoji,
    });
  }, [auctionId, addError]);

  /**
   * Connect on mount, disconnect on unmount
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connectSocket, isAuthenticated, user]);

  return {
    isConnected,
    error,
    isHostPresent,
    submitBid,
    startAuction,
    pauseAuction,
    resumeAuction,
    endAuction,
    sendMessage,
    deleteMessage: deleteMessageHandler,
    sendReaction,
  };
}
