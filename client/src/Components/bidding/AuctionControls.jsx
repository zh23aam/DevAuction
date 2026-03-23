import React, { useCallback } from 'react';
import { MdPlayArrow, MdPause, MdPlayCircle, MdStop } from 'react-icons/md';

function AuctionControls({ auctionStatus, userRole, onStart, onPause, onResume, onEnd }) {
  if (userRole !== 'host') return null;

  const isStartDisabled  = auctionStatus !== 'pending';
  const isPauseDisabled  = auctionStatus !== 'active';
  const isResumeDisabled = auctionStatus !== 'paused';
  const isEndDisabled    = auctionStatus === 'ended' || auctionStatus === 'pending';

  const handleStart  = useCallback(() => { if (!isStartDisabled && onStart) onStart(); },   [isStartDisabled, onStart]);
  const handlePause  = useCallback(() => { if (!isPauseDisabled && onPause) onPause(); },   [isPauseDisabled, onPause]);
  const handleResume = useCallback(() => { if (!isResumeDisabled && onResume) onResume(); }, [isResumeDisabled, onResume]);
  const handleEnd    = useCallback(() => { if (!isEndDisabled && onEnd) onEnd(); },          [isEndDisabled, onEnd]);

  const statusColors = {
    pending: 'bg-gray-500',
    active:  'bg-green-500',
    paused:  'bg-yellow-500',
    ended:   'bg-red-500',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Auction Controls</h3>
        <span className={`text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusColors[auctionStatus] || 'bg-gray-500'}`}>
          {auctionStatus}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {!isStartDisabled && (
          <button
            onClick={handleStart}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border border-green-500 text-green-400 hover:bg-green-500/10 active:scale-95 transition-all"
          >
            <MdPlayArrow className="text-lg" /> Start Auction
          </button>
        )}

        {!isPauseDisabled && (
          <button
            onClick={handlePause}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 active:scale-95 transition-all"
          >
            <MdPause className="text-lg" /> Pause Auction
          </button>
        )}

        {!isResumeDisabled && (
          <button
            onClick={handleResume}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border border-blue-500 text-blue-400 hover:bg-blue-500/10 active:scale-95 transition-all"
          >
            <MdPlayCircle className="text-lg" /> Resume Auction
          </button>
        )}

        {!isEndDisabled && (
          <button
            onClick={handleEnd}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border border-red-500 text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
          >
            <MdStop className="text-lg" /> End Auction
          </button>
        )}
      </div>
    </div>
  );
}

export default AuctionControls;
