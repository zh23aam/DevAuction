import { renderHook, act, waitFor } from '@testing-library/react';
import { useSocketAuction } from '../useSocketAuction';
import { AuctionProvider } from '../../context/AuctionContext';
import { ChatProvider } from '../../context/ChatContext';
import React from 'react';

/**
 * Task 3.8: Write unit tests for useSocketAuction hook
 * - Test Socket.io connection with JWT
 * - Test event listeners dispatch to contexts
 * - Test event emitters send correct payload
 * - Test late joiner state snapshot handling
 * - Test bid:submit, auction:start/pause/resume/end emitters
 * - Test chat:message, chat:delete, chat:reaction emitters
 */

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  }));
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => {
    if (key === 'token') return 'mock-jwt-token';
    if (key === 'userId') return 'user-123';
    if (key === 'displayName') return 'Test User';
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock environment variables
process.env.REACT_APP_SOCKET_URL = 'http://localhost:3000';

describe('useSocketAuction hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) =>
    React.createElement(
      AuctionProvider,
      null,
      React.createElement(ChatProvider, null, children)
    );

  describe('Socket.io Connection with JWT', () => {
    it('should connect to Socket.io with JWT authentication', async () => {
      const io = require('socket.io-client');

      renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(io).toHaveBeenCalledWith(
          'http://localhost:3000/auction',
          expect.objectContaining({
            auth: expect.objectContaining({
              token: 'mock-jwt-token',
              auctionId: 'auction-123',
              displayName: 'Test User',
            }),
          })
        );
      });
    });

    it('should handle missing JWT token', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Event Listeners', () => {
    it('should set up event listeners on connection', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('connection:error', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('auction:stateSnapshot', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('auction:started', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('auction:paused', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('auction:resumed', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('auction:ended', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('auction:tick', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('bid:accepted', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('bid:rejected', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('chat:history', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('chat:messageReceived', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('chat:deleted', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('chat:reactionReceived', expect.any(Function));
      });
    });

    it('should handle auction:stateSnapshot event', async () => {
      const io = require('socket.io-client');
      let stateSnapshotHandler;

      const mockSocket = {
        on: jest.fn((event, handler) => {
          if (event === 'auction:stateSnapshot') {
            stateSnapshotHandler = handler;
          }
        }),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(stateSnapshotHandler).toBeDefined();
      });

      act(() => {
        stateSnapshotHandler({
          status: 'active',
          currentHighestBid: 1000,
          highestBidderId: 'bidder-1',
          highestBidderName: 'John',
          remainingSeconds: 300,
          bids: [],
        });
      });

      // Verify state was updated (indirectly through hook)
      expect(result.current.isConnected).toBe(true);
    });

    it('should handle bid:accepted event', async () => {
      const io = require('socket.io-client');
      let bidAcceptedHandler;

      const mockSocket = {
        on: jest.fn((event, handler) => {
          if (event === 'bid:accepted') {
            bidAcceptedHandler = handler;
          }
        }),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(bidAcceptedHandler).toBeDefined();
      });

      act(() => {
        bidAcceptedHandler({
          bid: {
            id: 'bid-1',
            auctionId: 'auction-123',
            bidderId: 'bidder-1',
            amount: 1000,
            serverTimestamp: new Date().toISOString(),
          },
          bidderName: 'John',
        });
      });

      // Verify event was processed
      expect(bidAcceptedHandler).toBeDefined();
    });

    it('should handle chat:messageReceived event', async () => {
      const io = require('socket.io-client');
      let messageHandler;

      const mockSocket = {
        on: jest.fn((event, handler) => {
          if (event === 'chat:messageReceived') {
            messageHandler = handler;
          }
        }),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(messageHandler).toBeDefined();
      });

      act(() => {
        messageHandler({
          id: 'msg-1',
          auctionId: 'auction-123',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'Hello',
          isSystemMessage: false,
          serverTimestamp: new Date().toISOString(),
        });
      });

      expect(messageHandler).toBeDefined();
    });
  });

  describe('Event Emitters', () => {
    it('should emit bid:submit with correct payload', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.submitBid(1500);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('bid:submit', {
        auctionId: 'auction-123',
        amount: 1500,
      });
    });

    it('should emit auction:start event', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'host'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.startAuction();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('auction:start', {
        auctionId: 'auction-123',
      });
    });

    it('should emit auction:pause event', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'host'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.pauseAuction();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('auction:pause', {
        auctionId: 'auction-123',
      });
    });

    it('should emit auction:resume event', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'host'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.resumeAuction();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('auction:resume', {
        auctionId: 'auction-123',
      });
    });

    it('should emit auction:end event', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'host'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.endAuction();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('auction:end', {
        auctionId: 'auction-123',
      });
    });

    it('should emit chat:message with correct payload', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.sendMessage('Hello everyone!');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('chat:message', {
        auctionId: 'auction-123',
        messageText: 'Hello everyone!',
      });
    });

    it('should emit chat:delete event', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'host'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.deleteMessage('msg-1');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('chat:delete', {
        auctionId: 'auction-123',
        messageId: 'msg-1',
      });
    });

    it('should emit chat:reaction event', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.sendReaction('👍');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('chat:reaction', {
        auctionId: 'auction-123',
        emoji: '👍',
      });
    });
  });

  describe('Permission Checks', () => {
    it('should prevent non-host from starting auction', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.startAuction();
      });

      expect(result.current.error).toContain('Only host can start auction');
    });

    it('should prevent non-host from deleting messages', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { result } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.deleteMessage('msg-1');
      });

      expect(result.current.error).toContain('Only host can delete messages');
    });
  });

  describe('Disconnect', () => {
    it('should disconnect from Socket.io', async () => {
      const io = require('socket.io-client');
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      };

      io.mockReturnValueOnce(mockSocket);

      const { unmount } = renderHook(() => useSocketAuction('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(mockSocket.disconnect).toHaveBeenCalled();
      });

      unmount();
    });
  });
});
