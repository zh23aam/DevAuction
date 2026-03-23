import React, { useEffect, useRef } from 'react';

/**
 * BidHistory Component
 * Displays list of all accepted bids chronologically
 * Shows bidder name, amount, and timestamp
 * Scrolls to latest bid on new bid:accepted event
 * Displays winner announcement after auction:ended
 * 
 * Validates: Requirements 21, 25, 33
 */
function BidHistory({ bids, auctionStatus, highestBidderId, highestBidderName }) {
  const listRef = useRef(null);
  const lastBidRef = useRef(null);

  // Auto-scroll to latest bid
  useEffect(() => {
    if (lastBidRef.current) {
      lastBidRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [bids.length]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800 shrink-0">
        <h3 className="text-white font-semibold text-sm">Bid History</h3>
        <span className="text-gray-500 text-xs">{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
            <p className="text-sm">No bids yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {bids.map((bid, index) => (
              <div
                key={bid.id || index}
                className={`flex justify-between items-center px-3 py-2.5 rounded-lg ${index === bids.length - 1 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-800/60'}`}
                ref={index === bids.length - 1 ? lastBidRef : null}
              >
                <div>
                  <p className={`text-sm font-medium ${index === bids.length - 1 ? 'text-yellow-400' : 'text-white'}`}>
                    {bid.bidderName || 'Anonymous'}
                    {index === bids.length - 1 && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">highest</span>}
                  </p>
                  <p className="text-gray-500 text-xs">{formatTime(bid.serverTimestamp)}</p>
                </div>
                <p className={`font-bold text-base ${index === bids.length - 1 ? 'text-yellow-400' : 'text-white'}`}>
                  ${typeof bid.amount === 'number' ? bid.amount.toFixed(2) : bid.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {auctionStatus === 'ended' && bids.length > 0 && (
        <div className="px-3 py-3 border-t border-gray-800 bg-gray-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest">Auction Winner</p>
              <p className="text-white font-semibold text-sm">{highestBidderName || 'Unknown'}</p>
              <p className="text-yellow-400 text-xs font-bold">${bids[bids.length - 1].amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BidHistory;
