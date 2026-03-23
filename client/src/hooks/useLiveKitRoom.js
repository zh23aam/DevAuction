import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, Participant, RoomEvent, ParticipantEvent } from 'livekit-client';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../utils/api';
import { useAuction } from '../context/AuctionContext';

/**
 * useLiveKitRoom hook
 * Manages LiveKit room connection and participant management
 */
export function useLiveKitRoom(auctionId, userRole, preJoinTracks) {
  const { setActiveSpeaker, setConnectionQuality, addParticipant, removeParticipant } = useAuction();
  const { user, getAccessTokenSilently } = useAuth0();

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localParticipant, setLocalParticipant] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  const roomRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(3);
  const reconnectDelaysRef = useRef([1000, 2000, 4000]); // 1s, 2s, 4s
  const isMountedRef = useRef(true);

  /**
   * Request token from backend
   */
  const requestToken = useCallback(async () => {
    try {
      const auth0Token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });

      const data = await api.post(
        `/api/auctions/${auctionId}/token`,
        {
          userId: user?.sub,
          role: userRole,
          displayName: user?.name || user?.email || user?.sub,
        },
        {
          headers: {
            Authorization: `Bearer ${auth0Token}`,
          },
        }
      );

      return data.token;
    } catch (err) {
      console.error('[useLiveKitRoom] Error requesting token:', err);
      throw err;
    }
  }, [auctionId, userRole, user, getAccessTokenSilently]);

  /**
   * Connect to LiveKit room
   */
  const connectToRoom = useCallback(async () => {
    if (roomRef.current && roomRef.current.state === 'connected') {
      console.log('[useLiveKitRoom] Already connected, skipping');
      return;
    }

    try {
      const token = await requestToken();

      const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
      const roomName = `auction-${auctionId}`;

      const newRoom = new Room({
        audio: true,
        video: { resolution: { width: 640, height: 480 } },
        autoSubscribe: true,
      });

      await newRoom.connect(liveKitUrl, token);

      roomRef.current = newRoom;
      setRoom(newRoom);
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Set up event listeners
      setupRoomListeners(newRoom);

      // Populate existing participants for late joiners
      const existingParticipants = Array.from(newRoom.remoteParticipants.values());
      setParticipants(existingParticipants);
      console.log('[useLiveKitRoom] Late joiner - existing participants:', existingParticipants.length);

      // Publish tracks based on pre-join preferences
      try {
        const { createLocalVideoTrack, createLocalAudioTrack } = await import('livekit-client');

        if (preJoinTracks?.cameraEnabled !== false) {
          const videoTrack = await createLocalVideoTrack({
            resolution: { width: 640, height: 480 },
          });
          await newRoom.localParticipant.publishTrack(videoTrack);
          console.log('[useLiveKitRoom] Video track published');
        }

        if (preJoinTracks?.micEnabled !== false) {
          const audioTrack = await createLocalAudioTrack();
          await newRoom.localParticipant.publishTrack(audioTrack);
          console.log('[useLiveKitRoom] Audio track published');
        }
      } catch (err) {
        console.warn('[useLiveKitRoom] Failed to publish tracks:', err.message);
      }

      console.log('[useLiveKitRoom] Connected to room:', roomName);
    } catch (err) {
      console.error('[useLiveKitRoom] Connection error:', err);
      setError(err.message);
      attemptReconnect();
    }
  }, [auctionId, requestToken]);

  /**
   * Set up room event listeners
   */
  const setupRoomListeners = useCallback((liveKitRoom) => {
    // Participant connected
    liveKitRoom.on('participantConnected', (participant) => {
      console.log('[useLiveKitRoom] Participant connected:', participant.name);
      addParticipant({
        userId: participant.identity,
        displayName: participant.name,
        role: 'bidder', // Will be updated from context
        joinedAt: new Date(),
      });
    });

    // Participant disconnected
    liveKitRoom.on('participantDisconnected', (participant) => {
      console.log('[useLiveKitRoom] Participant disconnected:', participant.name);
      removeParticipant(participant.identity);
    });

    // Active speakers changed
    liveKitRoom.on('activeSpeakersChanged', (speakers) => {
      if (speakers.length > 0) {
        setActiveSpeaker(speakers[0].identity);
      } else {
        setActiveSpeaker(null);
      }
    });

    // Connection quality changed
    liveKitRoom.on('connectionQualityChanged', (participant, quality) => {
      const qualityMap = {
        'excellent': 'excellent',
        'good': 'good',
        'poor': 'poor',
        'unknown': 'unknown',
      };
      setConnectionQuality(participant.identity, qualityMap[quality] || 'unknown');
    });

    // Local track published
    liveKitRoom.on('localTrackPublished', (publication) => {
      if (publication.kind === 'video') setIsCameraEnabled(!publication.isMuted);
      if (publication.kind === 'audio') setIsMicEnabled(!publication.isMuted);
    });

    // Track muted
    liveKitRoom.localParticipant.on('trackMuted', (publication) => {
      if (publication.kind === 'video') setIsCameraEnabled(false);
      if (publication.kind === 'audio') setIsMicEnabled(false);
    });

    // Track unmuted
    liveKitRoom.localParticipant.on('trackUnmuted', (publication) => {
      if (publication.kind === 'video') setIsCameraEnabled(true);
      if (publication.kind === 'audio') setIsMicEnabled(true);
    });

    // Room disconnected
    liveKitRoom.on('disconnected', (reason) => {
      console.log('[useLiveKitRoom] Disconnected from room, reason:', reason);
      setIsConnected(false);
      // reason 2 = DUPLICATE_IDENTITY, reason 1 = CLIENT_INITIATED - don't reconnect
      if (isMountedRef.current && reason !== 2 && reason !== 1) {
        attemptReconnect();
      }
    });

    // Update participants list
    const updateParticipants = () => {
      const allParticipants = Array.from(liveKitRoom.remoteParticipants.values());
      setParticipants(allParticipants);
    };

    liveKitRoom.on('participantConnected', updateParticipants);
    liveKitRoom.on('participantDisconnected', updateParticipants);

    // Set local participant
    setLocalParticipant(liveKitRoom.localParticipant);

    // Capture already-present remote participants for late joiners
    updateParticipants();
  }, [addParticipant, removeParticipant, setActiveSpeaker, setConnectionQuality]);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (!isMountedRef.current) return;

    if (reconnectAttemptsRef.current < maxReconnectAttemptsRef.current) {
      const delay = reconnectDelaysRef.current[reconnectAttemptsRef.current];
      console.log(`[useLiveKitRoom] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

      setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        connectToRoom();
      }, delay);
    } else {
      setError('Failed to reconnect after multiple attempts');
      console.error('[useLiveKitRoom] Max reconnection attempts reached');
    }
  }, [connectToRoom]);

  /**
   * Disconnect from room
   */
  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      try {
        const lp = roomRef.current.localParticipant;
        if (lp) {
          // Stop all published tracks to release camera/mic hardware
          const pubs = Array.from(lp.trackPublications?.values() || []);
          for (const pub of pubs) {
            try {
              if (pub.track) {
                pub.track.stop();
                await lp.unpublishTrack(pub.track);
              }
            } catch (e) {}
          }
          // Also disable camera and mic via LiveKit API
          try { await lp.setCameraEnabled(false); } catch (e) {}
          try { await lp.setMicrophoneEnabled(false); } catch (e) {}
        }
        await roomRef.current.disconnect();
      } catch (e) {
        console.warn('[useLiveKitRoom] Disconnect error:', e.message);
      } finally {
        roomRef.current = null;
        setRoom(null);
        setIsConnected(false);
        setParticipants([]);
        setLocalParticipant(null);
        setIsCameraEnabled(false);
        setIsMicEnabled(false);
      }
    }
  }, []);

  /**
   * Toggle camera
   */
  const toggleCamera = useCallback(async () => {
    if (roomRef.current?.localParticipant) {
      const lp = roomRef.current.localParticipant;
      const newState = !lp.isCameraEnabled;
      await lp.setCameraEnabled(newState);
      setIsCameraEnabled(newState);
    }
  }, []);

  /**
   * Toggle microphone
   */
  const toggleMicrophone = useCallback(async () => {
    if (roomRef.current?.localParticipant) {
      const lp = roomRef.current.localParticipant;
      const newState = !lp.isMicrophoneEnabled;
      await lp.setMicrophoneEnabled(newState);
      setIsMicEnabled(newState);
    }
  }, []);

  /**
   * Mute participant (soft mute via track.enabled)
   */
  const muteParticipant = useCallback((participantId) => {
    const participant = roomRef.current?.remoteParticipants.get(participantId);
    if (participant) {
      participant.audioTracks.forEach(track => {
        track.track.enabled = false;
      });
    }
  }, []);

  /**
   * Unmute participant
   */
  const unmuteParticipant = useCallback((participantId) => {
    const participant = roomRef.current?.remoteParticipants.get(participantId);
    if (participant) {
      participant.audioTracks.forEach(track => {
        track.track.enabled = true;
      });
    }
  }, []);

  /**
   * Connect on mount
   */
  useEffect(() => {
    isMountedRef.current = true;
    connectToRoom();

    return () => {
      isMountedRef.current = false;
      if (roomRef.current) {
        try {
          const lp = roomRef.current.localParticipant;
          if (lp) {
            Array.from(lp.trackPublications?.values() || []).forEach(pub => {
              try { if (pub.track) pub.track.stop(); } catch (e) {}
            });
          }
          roomRef.current.disconnect();
        } catch (e) {}
        roomRef.current = null;
      }
    };
  }, [connectToRoom]);

  return {
    room,
    participants,
    localParticipant,
    isConnected,
    error,
    isCameraEnabled,
    isMicEnabled,
    connect: connectToRoom,
    disconnect,
    toggleCamera,
    toggleMicrophone,
    muteParticipant,
    unmuteParticipant,
  };
}
