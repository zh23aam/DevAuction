import React, { useState, useEffect } from 'react';

/**
 * TimerDisplay Component
 * Displays countdown in MM:SS format, updates on auction:tick events
 * Shows visual indicator when < 30 seconds (anti-sniping zone)
 * Flashes/animates on timer extension
 * Shows "Auction Ended" when status === 'ended'
 * 
 * Validates: Requirements 23, 24
 */
function TimerDisplay({ remainingSeconds, auctionStatus }) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [previousSeconds, setPreviousSeconds] = useState(remainingSeconds);

  // Detect timer extension (jump in remaining seconds)
  useEffect(() => {
    if (remainingSeconds > previousSeconds) {
      // Timer was extended, trigger animation
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousSeconds(remainingSeconds);
  }, [remainingSeconds, previousSeconds]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if in anti-sniping zone (< 30 seconds)
  const isAntiSnipingZone = remainingSeconds < 30 && remainingSeconds > 0;

  if (auctionStatus === 'ended') {
    return (
      <div className="flex items-center justify-center px-4 py-3 bg-gray-800">
        <span className="font-mono font-bold tracking-widest text-3xl text-gray-400">
          Auction Ended
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center px-4 py-3 transition-colors ${isAntiSnipingZone ? 'bg-red-900/60' : 'bg-gradient-to-r from-indigo-900 to-purple-900'}`}>
      <div className="flex flex-col items-center gap-1">
        <span className={`font-mono font-bold tracking-widest text-3xl ${isAntiSnipingZone ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {formatTime(remainingSeconds)}
        </span>
        {isAntiSnipingZone && (
          <div className="flex items-center gap-1 text-red-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
            <span>Final 30 seconds</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimerDisplay;
