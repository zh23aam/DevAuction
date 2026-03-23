import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BidPanel } from './BidPanel';
import { AuctionProvider } from '../../context/AuctionContext';
import * as useSocketAuctionModule from '../../hooks/useSocketAuction';

// Mock the useSocketAuction hook
jest.mock('../../hooks/useSocketAuction');

describe('BidPanel Component', () => {
  const mockSubmitBid = jest.fn();
  const defaultAuctionState = {
    currentHighestBid: 100,
    highestBidderName: 'John Doe',
    minimumIncrement: 10,
    auctionStatus: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSocketAuctionModule.useSocketAuction.mockReturnValue({
      submitBid: mockSubmitBid,
      error: null,
      isConnected: true,
      startAuction: jest.fn(),
      pauseAuction: jest.fn(),
      resumeAuction: jest.fn(),
      endAuction: jest.fn(),
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      sendReaction: jest.fn(),
    });
  });

  const renderBidPanel = (userRole = 'bidder', auctionState = defaultAuctionState) => {
    const mockUseAuction = jest.fn(() => ({
      state: auctionState,
      setAuctionStatus: jest.fn(),
      setHighestBid: jest.fn(),
      addBid: jest.fn(),
      setRemainingSeconds: jest.fn(),
      addParticipant: jest.fn(),
      removeParticipant: jest.fn(),
      setActiveSpeaker: jest.fn(),
      setConnectionQuality: jest.fn(),
      addError: jest.fn(),
      clearErrors: jest.fn(),
    }));

    jest.doMock('../../context/AuctionContext', () => ({
      useAuction: mockUseAuction,
      AuctionProvider,
    }));

    return render(
      <AuctionProvider>
        <BidPanel userRole={userRole} auctionId="test-auction-123" />
      </AuctionProvider>
    );
  };

  describe('Display Requirements', () => {
    it('should display current highest bid', () => {
      renderBidPanel();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should display highest bidder name', () => {
      renderBidPanel();
      expect(screen.getByText(/by John Doe/)).toBeInTheDocument();
    });

    it('should display minimum required bid', () => {
      renderBidPanel();
      expect(screen.getByText('$110.00')).toBeInTheDocument();
    });

    it('should display bid input form', () => {
      renderBidPanel();
      expect(screen.getByLabelText('Your Bid')).toBeInTheDocument();
    });

    it('should display submit button', () => {
      renderBidPanel();
      expect(screen.getByRole('button', { name: /Place Bid/i })).toBeInTheDocument();
    });
  });

  describe('Bid Validation (Requirement 17, 18)', () => {
    it('should reject bid not greater than current highest bid', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '100');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Bid must be greater than current highest bid/)).toBeInTheDocument();
      });
      expect(mockSubmitBid).not.toHaveBeenCalled();
    });

    it('should reject bid below minimum increment', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '105');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Bid must be at least \$110.00/)).toBeInTheDocument();
      });
      expect(mockSubmitBid).not.toHaveBeenCalled();
    });

    it('should accept valid bid', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '120');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmitBid).toHaveBeenCalledWith(120);
      });
    });

    it('should accept bid exactly at minimum required', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '110');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmitBid).toHaveBeenCalledWith(110);
      });
    });
  });

  describe('Input Disabling (Requirement 22 - Observer)', () => {
    it('should disable input for observers', () => {
      renderBidPanel('observer');
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      expect(input).toBeDisabled();
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText(/Observers cannot submit bids/)).toBeInTheDocument();
    });
  });

  describe('Input Disabling (Auction Status)', () => {
    it('should disable input when auction is not active', () => {
      const inactiveState = { ...defaultAuctionState, auctionStatus: 'paused' };
      renderBidPanel('bidder', inactiveState);
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      expect(input).toBeDisabled();
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText(/Auction is paused/)).toBeInTheDocument();
    });

    it('should disable input when auction has ended', () => {
      const endedState = { ...defaultAuctionState, auctionStatus: 'ended' };
      renderBidPanel('bidder', endedState);
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      expect(input).toBeDisabled();
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText(/Auction is ended/)).toBeInTheDocument();
    });
  });

  describe('Error Display (Requirement 21)', () => {
    it('should display bid:rejected errors from socket', async () => {
      useSocketAuctionModule.useSocketAuction.mockReturnValue({
        submitBid: mockSubmitBid,
        error: 'You are already the highest bidder',
        isConnected: true,
        startAuction: jest.fn(),
        pauseAuction: jest.fn(),
        resumeAuction: jest.fn(),
        endAuction: jest.fn(),
        sendMessage: jest.fn(),
        deleteMessage: jest.fn(),
        sendReaction: jest.fn(),
      });

      renderBidPanel();

      await waitFor(() => {
        expect(screen.getByText(/You are already the highest bidder/)).toBeInTheDocument();
      });
    });

    it('should clear error on new submission', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      // First invalid submission
      await userEvent.type(input, '100');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Bid must be greater than current highest bid/)).toBeInTheDocument();
      });

      // Clear and try again
      await userEvent.clear(input);
      await userEvent.type(input, '120');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmitBid).toHaveBeenCalledWith(120);
      });
    });
  });

  describe('Form Submission (Requirement 21)', () => {
    it('should submit bid via Socket.io', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '150');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmitBid).toHaveBeenCalledWith(150);
      });
    });

    it('should clear input after successful submission', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '150');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(input).toHaveValue(null);
      });
    });

    it('should show loading state during submission', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '150');
      fireEvent.click(submitBtn);

      // Button should show loading state briefly
      expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Host Role', () => {
    it('should allow host to submit bids', async () => {
      renderBidPanel('host');
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      expect(input).not.toBeDisabled();
      expect(submitBtn).not.toBeDisabled();

      await userEvent.type(input, '150');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmitBid).toHaveBeenCalledWith(150);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal bid amounts', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '110.50');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmitBid).toHaveBeenCalledWith(110.50);
      });
    });

    it('should reject invalid input', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, 'abc');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid bid amount/)).toBeInTheDocument();
      });
      expect(mockSubmitBid).not.toHaveBeenCalled();
    });

    it('should reject negative bid', async () => {
      renderBidPanel();
      const input = screen.getByLabelText('Your Bid');
      const submitBtn = screen.getByRole('button', { name: /Place Bid/i });

      await userEvent.type(input, '-50');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid bid amount/)).toBeInTheDocument();
      });
      expect(mockSubmitBid).not.toHaveBeenCalled();
    });
  });
});
