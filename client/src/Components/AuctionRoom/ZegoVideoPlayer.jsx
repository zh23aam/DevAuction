import React, { useEffect, useRef } from 'react';

const ZegoVideoPlayer = ({ stream, isLocal, userId, userName, engine }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    // Attach stream to video element
    videoRef.current.srcObject = stream;
    
    // If it's a remote stream, we might need to handle play/pause or mute explicitly
    // but srcObject usually handles the basic rendering
  }, [stream]);

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border border-white/5 shadow-lg group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to avoid feedback
        className="w-full h-full object-cover"
      />
      
      {/* Overlay Info */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[10px] font-bold text-white tracking-wider truncate max-w-[120px]">
          {userName || userId} {isLocal && "(You)"}
        </span>
      </div>

      {/* Connection Quality Indicator (Placeholder) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-0.5 items-end h-3">
          <div className="w-0.5 h-1 bg-green-500"></div>
          <div className="w-0.5 h-1.5 bg-green-500"></div>
          <div className="w-0.5 h-2 bg-green-500"></div>
          <div className="w-0.5 h-3 bg-green-500"></div>
        </div>
      </div>
    </div>
  );
};

export default ZegoVideoPlayer;
