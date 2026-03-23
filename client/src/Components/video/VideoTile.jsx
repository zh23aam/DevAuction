import React, { useEffect, useRef } from 'react';
import CameraPlaceholder from './CameraPlaceholder';
import ConnectionQualityIndicator from './ConnectionQualityIndicator';
import ActiveSpeakerHighlight from './ActiveSpeakerHighlight';

/**
 * VideoTile Component
 * 
 * Renders an individual participant's video tile with:
 * - Video element when camera is on
 * - Placeholder when camera is off
 * - Participant name and initials
 * - Active speaker highlight
 * - Connection quality indicator
 * - Muted badge if applicable
 * 
 * Satisfies: Requirements 3, 4, 7, 8, 9
 * (Media Publishing, Muting, Camera-Off Placeholder, Active Speaker, Connection Quality)
 */
function VideoTile({
  participant = {},
  isActive = false,
  isLocal = false,
  isMuted = false,
  connectionQuality = 'unknown',
}) {
  const videoRef = useRef(null);
  const {
    userId = '',
    displayName = 'Unknown',
    videoTrack = null,
    audioTrack = null,
  } = participant;

  // Attach video track to video element
  useEffect(() => {
    if (!videoRef.current || !videoTrack) {
      return;
    }

    // Attach the track to the video element
    videoTrack.attach(videoRef.current);

    // Cleanup: detach track when component unmounts or track changes
    return () => {
      if (videoTrack) {
        videoTrack.detach();
      }
    };
  }, [videoTrack]);

  // Handle track mute/unmute
  useEffect(() => {
    if (!videoRef.current || !videoTrack) return;
    if (!videoTrack.isMuted) {
      videoTrack.attach(videoRef.current);
    }
  }, [videoTrack, videoTrack?.isMuted]);

  // Determine if camera is enabled
  const isCameraOn = videoTrack && !videoTrack.isMuted;

  // Generate background color from user ID hash
  const getBackgroundColor = (id) => {
    if (!id) return '#667eea';
    const hash = id.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden rounded-lg">
      {/* Active speaker highlight */}
      <ActiveSpeakerHighlight isActive={isActive} />

      {/* Video or placeholder */}
      <div className="absolute inset-0">
        {isCameraOn ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted={isLocal}
            playsInline
            style={isLocal ? { transform: 'scaleX(-1)' } : {}}
          />
        ) : (
          <CameraPlaceholder
            displayName={displayName}
            backgroundColor={getBackgroundColor(userId)}
          />
        )}
      </div>

      {/* Participant info overlay */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <div className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">{displayName}</div>

        {/* Connection quality indicator */}
        <ConnectionQualityIndicator quality={connectionQuality} />

        {/* Muted badge */}
        {isMuted && (
          <div className="flex items-center gap-1 text-white text-xs bg-black/50 px-2 py-1 rounded-full">
            <span>🔇</span>
            <span>Muted</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoTile;
