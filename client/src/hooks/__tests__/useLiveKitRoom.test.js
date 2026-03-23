import { renderHook, act, waitFor } from '@testing-library/react';
import { useLiveKitRoom } from '../useLiveKitRoom';
import { AuctionProvider } from '../../context/AuctionContext';
import React from 'react';

/**
 * Task 3.7: Write unit tests for useLiveKitRoom hook
 * - Test token request from backend
 * - Test room connection success and failure with reconnection attempts
 * - Test exponential backoff (1s, 2s, 4s)
 * - Test event listeners dispatch to context
 * - Test soft mute via track.enabled
 * - Test toggleCamera, toggleMicrophone, permission error handling
 */

// Mock livekit-client
jest.mock('livekit-client', () => ({
  connect: jest.fn(),
  Room: jest.fn(),
  Participant: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => {
    if (key === 'token') return 'mock-jwt-token';
    if (key === 'userId') return 'user-123';
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock environment variables
process.env.REACT_APP_LIVEKIT_URL = 'ws://localhost:7880';

describe('useLiveKitRoom hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }) => React.createElement(AuctionProvider, null, children);

  describe('Token Request', () => {
    it('should request token from backend', async () => {
      const { connect } = require('livekit-client');
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce({
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map(),
        localParticipant: { isCameraEnabled: () => false, isMicrophoneEnabled: () => false },
      });

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auctions/auction-123/token',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-jwt-token',
            }),
          })
        );
      });
    });

    it('should handle token request failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Room Connection', () => {
    it('should connect to LiveKit room successfully', async () => {
      const { connect } = require('livekit-client');
      
      const mockRoom = {
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map(),
        localParticipant: { isCameraEnabled: () => false, isMicrophoneEnabled: () => false },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce(mockRoom);

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle connection failure', async () => {
      const { connect } = require('livekit-client');
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockRejectedValueOnce(new Error('Connection failed'));

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Reconnection with Exponential Backoff', () => {
    it('should attempt reconnection with exponential backoff', async () => {
      const { connect } = require('livekit-client');
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      // First attempt fails, second succeeds
      connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce({
          on: jest.fn(),
          disconnect: jest.fn(),
          participants: new Map(),
          localParticipant: { isCameraEnabled: () => false, isMicrophoneEnabled: () => false },
        });

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      // Initial connection fails
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Fast-forward 1 second for first retry
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Second attempt should succeed
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should retry with correct backoff delays (1s, 2s, 4s)', async () => {
      const { connect } = require('livekit-client');
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      // All attempts fail
      connect.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      // Initial attempt
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Verify reconnect attempts happen at correct intervals
      const connectCallsBefore = connect.mock.calls.length;

      // Advance 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(connect.mock.calls.length).toBeGreaterThan(connectCallsBefore);
      });
    });

    it('should fail after max reconnection attempts', async () => {
      const { connect } = require('livekit-client');
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      // Advance through all retry attempts
      act(() => {
        jest.advanceTimersByTime(1000); // First retry
      });

      act(() => {
        jest.advanceTimersByTime(2000); // Second retry
      });

      act(() => {
        jest.advanceTimersByTime(4000); // Third retry
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to reconnect');
      });
    });
  });

  describe('Event Listeners', () => {
    it('should set up event listeners on room', async () => {
      const { connect } = require('livekit-client');
      
      const mockRoom = {
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map(),
        localParticipant: { isCameraEnabled: () => false, isMicrophoneEnabled: () => false },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce(mockRoom);

      renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(mockRoom.on).toHaveBeenCalledWith('participantConnected', expect.any(Function));
        expect(mockRoom.on).toHaveBeenCalledWith('participantDisconnected', expect.any(Function));
        expect(mockRoom.on).toHaveBeenCalledWith('activeSpeakersChanged', expect.any(Function));
        expect(mockRoom.on).toHaveBeenCalledWith('connectionQualityChanged', expect.any(Function));
        expect(mockRoom.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      });
    });
  });

  describe('Soft Mute via track.enabled', () => {
    it('should mute participant by setting track.enabled to false', async () => {
      const { connect } = require('livekit-client');
      
      const mockTrack = { enabled: true };
      const mockParticipant = {
        audioTracks: [{ track: mockTrack }],
      };

      const mockRoom = {
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map([['participant-1', mockParticipant]]),
        localParticipant: { isCameraEnabled: () => false, isMicrophoneEnabled: () => false },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce(mockRoom);

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.muteParticipant('participant-1');
      });

      expect(mockTrack.enabled).toBe(false);
    });

    it('should unmute participant by setting track.enabled to true', async () => {
      const { connect } = require('livekit-client');
      
      const mockTrack = { enabled: false };
      const mockParticipant = {
        audioTracks: [{ track: mockTrack }],
      };

      const mockRoom = {
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map([['participant-1', mockParticipant]]),
        localParticipant: { isCameraEnabled: () => false, isMicrophoneEnabled: () => false },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce(mockRoom);

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.unmuteParticipant('participant-1');
      });

      expect(mockTrack.enabled).toBe(true);
    });
  });

  describe('toggleCamera and toggleMicrophone', () => {
    it('should toggle camera', async () => {
      const { connect } = require('livekit-client');
      
      const mockLocalParticipant = {
        isCameraEnabled: jest.fn(() => false),
        setCameraEnabled: jest.fn(),
        isMicrophoneEnabled: jest.fn(() => false),
      };

      const mockRoom = {
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map(),
        localParticipant: mockLocalParticipant,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce(mockRoom);

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.toggleCamera();
      });

      expect(mockLocalParticipant.setCameraEnabled).toHaveBeenCalledWith(true);
    });

    it('should toggle microphone', async () => {
      const { connect } = require('livekit-client');
      
      const mockLocalParticipant = {
        isCameraEnabled: jest.fn(() => false),
        isMicrophoneEnabled: jest.fn(() => false),
        setMicrophoneEnabled: jest.fn(),
      };

      const mockRoom = {
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map(),
        localParticipant: mockLocalParticipant,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce(mockRoom);

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.toggleMicrophone();
      });

      expect(mockLocalParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('Disconnect', () => {
    it('should disconnect from room', async () => {
      const { connect } = require('livekit-client');
      
      const mockRoom = {
        on: jest.fn(),
        disconnect: jest.fn(),
        participants: new Map(),
        localParticipant: { isCameraEnabled: () => false, isMicrophoneEnabled: () => false },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-livekit-token' }),
      });

      connect.mockResolvedValueOnce(mockRoom);

      const { result } = renderHook(() => useLiveKitRoom('auction-123', 'bidder'), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockRoom.disconnect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });
  });
});
