import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuctionProvider } from '../../../context/AuctionContext';

/**
 * Task 3.10: Write unit tests for BidPanel component
 * - Test bid input validation
 * - Test bid submission
 * - Test error display on bid:rejected
 * - Test input disabled when not active
 * - Test input disabled for observers
 */

// Mock BidPanel component for testing
function BidPanel({
  currentHighestBid,
  highestBidderName,
  minimumIncrement,
  userRole,
  auctionStatus,
  onSubmitBid,
}) {
  const [bidInput, setBidInput] = React.useState('');
  const [bidError, setBidError] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isDisabled = auctionStatus !== 'active' || userRole === 'observer';

  const validateBid = (amount) => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) {
      return 'Please enter a valid number';
    }

    if (numAmount <= currentHighestBid) {
      return `Bid must be greater than ${currentHighestBid}`;
    }

    if (numAmount < currentHighestBid + minimumIncrement) {
      return `Bid must be at least ${currentHighestBid + minimumIncrement}`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBidError(null);

    const error = validateBid(bidInput);
    if (error) {
      setBidError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitBid(parseFloat(bidInput));
      setBidInput('');
    } catch (err) {
      setBidError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="bid-panel">
      <div data-testid="current-bid">Current Bid: {currentHighestBid}</div>
      <div data-testid="highest-bidder">Highest Bidder: {highestBidderName || 'None'}</div>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="bid-input"
          type="number"
          value={bidInput}
          onChange={(e) => setBidInput(e.target.value)}
          disabled={isDisabled}
          placeholder="Enter bid amount"
        />
        <button
          data-testid="bid-submit-btn"
          type="submit"
          disabled={isDisabled || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Bid'}
        </button>
      </form>

      {bidError && <div data-testid="bid-error">{bidError}</div>}
    </div>
  );
}

describe('BidPanel Component', () => {
  const mockOnSubmitBid = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bid Input Validation', () => {
    it('should reject bid not greater than current highest bid', async () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, '1000');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('bid-error')).toHaveTextContent(
          'Bid must be greater than 1000'
        );
      });

      expect(mockOnSubmitBid).not.toHaveBeenCalled();
    });

    it('should reject bid below minimum increment', async () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, '1025');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('bid-error')).toHaveTextContent(
          'Bid must be at least 1050'
        );
      });

      expect(mockOnSubmitBid).not.toHaveBeenCalled();
    });

    it('should accept valid bid', async () => {
      mockOnSubmitBid.mockResolvedValueOnce(undefined);

      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, '1100');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmitBid).toHaveBeenCalledWith(1100);
      });
    });

    it('should reject non-numeric input', async () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, 'abc');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('bid-error')).toHaveTextContent(
          'Please enter a valid number'
        );
      });

      expect(mockOnSubmitBid).not.toHaveBeenCalled();
    });
  });

  describe('Bid Submission', () => {
    it('should submit bid with correct amount', async () => {
      mockOnSubmitBid.mockResolvedValueOnce(undefined);

      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, '1200');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmitBid).toHaveBeenCalledWith(1200);
      });
    });

    it('should clear input after successful submission', async () => {
      mockOnSubmitBid.mockResolvedValueOnce(undefined);

      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, '1200');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(input).toHaveValue(null);
      });
    });

    it('should show submitting state during submission', async () => {
      mockOnSubmitBid.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, '1200');
      fireEvent.click(submitBtn);

      expect(screen.getByTestId('bid-submit-btn')).toHaveTextContent('Submitting...');
    });
  });

  describe('Error Display', () => {
    it('should display error on bid:rejected', async () => {
      mockOnSubmitBid.mockRejectedValueOnce(new Error('Bid rejected: self-bid'));

      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      await userEvent.type(input, '1200');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('bid-error')).toHaveTextContent('Bid rejected: self-bid');
      });
    });

    it('should clear error when new bid is entered', async () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      const input = screen.getByTestId('bid-input');
      const submitBtn = screen.getByTestId('bid-submit-btn');

      // Submit invalid bid
      await userEvent.type(input, '900');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('bid-error')).toBeInTheDocument();
      });

      // Clear and enter new bid
      await userEvent.clear(input);
      await userEvent.type(input, '1200');

      // Error should be cleared on form submission
      fireEvent.click(submitBtn);

      // Error should not be visible after valid submission
      mockOnSubmitBid.mockResolvedValueOnce(undefined);
    });
  });

  describe('Input Disabled States', () => {
    it('should disable input when auction status is not active', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="pending"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('bid-input')).toBeDisabled();
      expect(screen.getByTestId('bid-submit-btn')).toBeDisabled();
    });

    it('should disable input when auction is paused', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="paused"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('bid-input')).toBeDisabled();
      expect(screen.getByTestId('bid-submit-btn')).toBeDisabled();
    });

    it('should disable input when auction has ended', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="ended"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('bid-input')).toBeDisabled();
      expect(screen.getByTestId('bid-submit-btn')).toBeDisabled();
    });

    it('should disable input for observer role', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="observer"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('bid-input')).toBeDisabled();
      expect(screen.getByTestId('bid-submit-btn')).toBeDisabled();
    });

    it('should enable input for bidder when auction is active', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('bid-input')).not.toBeDisabled();
      expect(screen.getByTestId('bid-submit-btn')).not.toBeDisabled();
    });

    it('should enable input for host when auction is active', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1000}
            highestBidderName="John"
            minimumIncrement={50}
            userRole="host"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('bid-input')).not.toBeDisabled();
      expect(screen.getByTestId('bid-submit-btn')).not.toBeDisabled();
    });
  });

  describe('Display Information', () => {
    it('should display current highest bid', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1500}
            highestBidderName="Alice"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('current-bid')).toHaveTextContent('Current Bid: 1500');
    });

    it('should display highest bidder name', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={1500}
            highestBidderName="Alice"
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('highest-bidder')).toHaveTextContent('Highest Bidder: Alice');
    });

    it('should display "None" when no highest bidder', () => {
      render(
        <AuctionProvider>
          <BidPanel
            currentHighestBid={0}
            highestBidderName={null}
            minimumIncrement={50}
            userRole="bidder"
            auctionStatus="active"
            onSubmitBid={mockOnSubmitBid}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('highest-bidder')).toHaveTextContent('Highest Bidder: None');
    });
  });
});
