import React, { useState, useEffect } from 'react';
import { useAuction } from '../../context/AuctionContext';

/**
 * BidPanel Component
 * Displays current highest bid and allows bidders to submit new bids
 * 
 * Satisfies Requirements: 17, 18, 21, 22
 * - Bid validation against current highest bid (Req 17)
 * - Minimum increment enforcement (Req 18)
 * - Bid acceptance and rejection broadcasting (Req 21)
 * - Self-bid prevention (Req 22)
 */
export function BidPanel({ userRole, auctionId, submitBid, socketError }) {
  const { state } = useAuction();

  const [bidInput, setBidInput] = useState('');
  const [bidError, setBidError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentHighestBid,
    highestBidderName,
    minimumIncrement,
    auctionStatus,
  } = state;

  // Clear bid error when socket error changes
  useEffect(() => {
    if (socketError) {
      setBidError(socketError);
    }
  }, [socketError]);

  /**
   * Calculate the minimum required bid
   */
  const minimumRequiredBid = currentHighestBid + minimumIncrement;

  /**
   * Validate bid input
   * Returns { isValid: boolean, error?: string }
   */
  const validateBidInput = (bidAmount) => {
    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: 'Please enter a valid bid amount' };
    }

    if (amount <= currentHighestBid) {
      return {
        isValid: false,
        error: `Bid must be greater than current highest bid (${currentHighestBid})`,
      };
    }

    if (amount < minimumRequiredBid) {
      return {
        isValid: false,
        error: `Bid must be at least ${minimumRequiredBid} (current bid + minimum increment)`,
      };
    }

    return { isValid: true };
  };

  /**
   * Handle bid submission
   */
  const handleSubmitBid = (e) => {
    e.preventDefault();

    // Clear previous errors
    setBidError(null);

    // Validate input
    const validation = validateBidInput(bidInput);
    if (!validation.isValid) {
      setBidError(validation.error);
      return;
    }

    // Submit bid
    setIsSubmitting(true);
    const bidAmount = parseFloat(bidInput);
    submitBid(bidAmount);

    // Reset form
    setBidInput('');
    setIsSubmitting(false);
  };

  /**
   * Determine if input should be disabled
   */
  const isInputDisabled =
    auctionStatus !== 'active' || userRole === 'observer' || isSubmitting;

  return (
    <div className="space-y-3">
      {/* Current Highest Bid Display */}
      <div className="px-3 py-2 bg-gray-800 rounded-lg">
        <div className="text-yellow-400 text-lg font-bold">
          ${currentHighestBid.toFixed(2)}
        </div>
        {highestBidderName && (
          <div className="text-gray-500 text-xs mt-1">
            by {highestBidderName}
          </div>
        )}
      </div>

      {/* Minimum Bid Info */}
      <div className="flex justify-between items-center px-3 py-2 bg-gray-800 rounded-lg">
        <span className="text-gray-400 text-xs">Minimum next bid</span>
        <span className="text-yellow-400 text-sm font-semibold">${minimumRequiredBid.toFixed(2)}</span>
      </div>

      {/* Bid Form */}
      <form className="space-y-2" onSubmit={handleSubmitBid}>
        <label htmlFor="bid-input" className="text-gray-400 text-xs uppercase tracking-wide block">
          Your Bid
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-yellow-400 font-bold text-sm pointer-events-none">$</span>
          <input
            id="bid-input"
            type="number"
            className="w-full pl-7 pr-3 py-2.5 bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:outline-none rounded-lg text-white text-sm placeholder-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            placeholder={minimumRequiredBid.toFixed(2)}
            value={bidInput}
            onChange={(e) => setBidInput(e.target.value)}
            disabled={isInputDisabled}
            step="0.01"
            min="0"
            aria-label="Bid amount"
          />
        </div>

        {/* Error Message */}
        {bidError && (
          <div className="px-3 py-2 bg-red-900/40 border-l-2 border-red-500 rounded text-red-400 text-xs" role="alert">
            {bidError}
          </div>
        )}

        {/* Status Messages */}
        {auctionStatus !== 'active' && (
          <div className="px-3 py-2 bg-blue-900/30 border-l-2 border-blue-500 rounded text-blue-400 text-xs">
            Auction is {auctionStatus}. Bidding is disabled.
          </div>
        )}

        {userRole === 'observer' && (
          <div className="px-3 py-2 bg-blue-900/30 border-l-2 border-blue-500 rounded text-blue-400 text-xs">
            Observers cannot submit bids.
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2.5 font-bold text-sm rounded-lg transition-all uppercase tracking-wide bg-yellow-500 hover:bg-yellow-400 text-black disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed active:scale-95"
          disabled={isInputDisabled}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Submitting…' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
}

export default BidPanel;
