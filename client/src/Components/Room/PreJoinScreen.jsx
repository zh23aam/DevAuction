import React, { useState, useEffect, useRef } from 'react';
import { MdVideocam, MdVideocamOff, MdMic, MdMicOff } from 'react-icons/md';
import './PreJoinScreen.css';

/**
 * PreJoinScreen Component
 * Shows before entering the auction room
 * Requests camera and microphone permissions
 * Shows live preview of user's camera
 * Allows toggling camera and mic on/off
 * Remembers user preferences in localStorage
 */
function PreJoinScreen({ onJoin, onCancel, auctionTitle }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isJoiningRef = useRef(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedCameraEnabled = localStorage.getItem('preJoin_cameraEnabled');
    const savedMicEnabled = localStorage.getItem('preJoin_micEnabled');

    if (savedCameraEnabled !== null) {
      setCameraEnabled(JSON.parse(savedCameraEnabled));
    }
    if (savedMicEnabled !== null) {
      setMicEnabled(JSON.parse(savedMicEnabled));
    }
  }, []);

  // Request permissions and get media stream
  useEffect(() => {
    const getMediaStream = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setStream(mediaStream);
        streamRef.current = mediaStream;
        window._activeMediaStream = mediaStream; // expose for cleanup on hard leave

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Media access error:', err);

        if (err.name === 'NotAllowedError') {
          setError('Camera and microphone permissions were denied. You can still join as an observer.');
        } else if (err.name === 'NotReadableError') {
          setError('Your camera or microphone is already in use by another application.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found on your device.');
        } else {
          setError('Failed to access camera and microphone. Please check your device settings.');
        }

        setIsLoading(false);
      }
    };

    getMediaStream();

    // Cleanup: stop all tracks when component unmounts (but not when joining)
    return () => {
      if (streamRef.current && !isJoiningRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle camera toggle
  const handleToggleCamera = () => {
    const newState = !cameraEnabled;
    setCameraEnabled(newState);
    localStorage.setItem('preJoin_cameraEnabled', JSON.stringify(newState));

    // Toggle video track enabled state
    const videoTrack = stream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = newState;
    }

    // Show/hide video preview
    if (videoRef.current) {
      videoRef.current.srcObject = newState ? stream : null;
    }
  };

  // Handle mic toggle
  const handleToggleMic = () => {
    const newState = !micEnabled;
    setMicEnabled(newState);
    localStorage.setItem('preJoin_micEnabled', JSON.stringify(newState));

    // Toggle audio track enabled state
    const audioTrack = stream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = newState;
    }
  };

  // Attach stream to video element when stream or camera state changes
  useEffect(() => {
    if (videoRef.current && stream && cameraEnabled) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err);
      });
    }
  }, [stream, cameraEnabled]);

  // Handle join button
  const handleJoin = () => {
    isJoiningRef.current = true;
    // Get current tracks from stream
    const videoTrack = stream?.getVideoTracks()[0] || null;
    const audioTrack = stream?.getAudioTracks()[0] || null;

    onJoin({
      videoTrack,
      audioTrack,
      cameraEnabled,
      micEnabled,
    });
  };

  // Handle cancel button - stop all tracks before navigating away
  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  return (
    <div className="pre-join-screen">
      <div className="pre-join-container">
        {/* Header */}
        <div className="pre-join-header">
          <h1 className="pre-join-title">Join Auction</h1>
          <p className="pre-join-subtitle">{auctionTitle || 'Live Auction Room'}</p>
        </div>

        {/* Video Preview */}
        <div className="pre-join-video-section">
          {isLoading ? (
            <div className="pre-join-loading">
              <div className="loading-spinner"></div>
              <p>Requesting camera and microphone access...</p>
            </div>
          ) : error ? (
            <div className="pre-join-error">
              <p className="error-message">{error}</p>
              <p className="error-note">You can still join as an observer.</p>
            </div>
          ) : cameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              className="pre-join-video"
            />
          ) : (
            <div className="pre-join-no-camera">
              <MdVideocamOff size={64} />
              <p>Camera is off</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="pre-join-controls">
          <button
            className={`control-btn ${cameraEnabled ? 'active' : 'inactive'}`}
            onClick={handleToggleCamera}
            title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraEnabled ? (
              <MdVideocam size={24} />
            ) : (
              <MdVideocamOff size={24} />
            )}
            <span>{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
          </button>

          <button
            className={`control-btn ${micEnabled ? 'active' : 'inactive'}`}
            onClick={handleToggleMic}
            title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? (
              <MdMic size={24} />
            ) : (
              <MdMicOff size={24} />
            )}
            <span>{micEnabled ? 'Mic On' : 'Mic Off'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pre-join-actions">
          <button
            className="btn btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-join"
            onClick={handleJoin}
            disabled={isLoading}
          >
            Join Auction
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreJoinScreen;
