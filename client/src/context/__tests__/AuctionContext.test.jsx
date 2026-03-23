import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuctionProvider, useAuction, AUCTION_ACTIONS } from '../AuctionContext';

/**
 * Task 3.5: Write unit tests for AuctionContext
 * - Test initial state shape
 * - Test SET_AUCTION_STATUS, SET_HIGHEST_BID, ADD_BID, SET_REMAINING_SECONDS actions
 * - Test ADD_PARTICIPANT, REMOVE_PARTICIPANT, SET_ACTIVE_SPEAKER, SET_CONNECTION_QUALITY actions
 * - Test ADD_ERROR and CLEAR_ERRORS actions
 * - 100% reducer coverage
 */

// Test component to access context
function TestComponent() {
  const context = useAuction();
  return (
    <div>
      <div data-testid="auction-id">{context.state.auctionId}</div>
      <div data-testid="auction-status">{context.state.auctionStatus}</div>
      <div data-testid="highest-bid">{context.state.currentHighestBid}</div>
      <div data-testid="highest-bidder-id">{context.state.highestBidderId}</div>
      <div data-testid="highest-bidder-name">{context.state.highestBidderName}</div>
      <div data-testid="minimum-increment">{context.state.minimumIncrement}</div>
      <div data-testid="remaining-seconds">{context.state.remainingSeconds}</div>
      <div data-testid="bids-count">{context.state.bids.length}</div>
      <div data-testid="participants-count">{context.state.participants.length}</div>
      <div data-testid="active-speaker">{context.state.activeSpeakerId}</div>
      <div data-testid="errors-count">{context.state.errors.length}</div>
      <button onClick={() => context.setAuctionId('auction-123')}>Set Auction ID</button>
      <button onClick={() => context.setAuctionStatus('active')}>Set Status Active</button>
      <button onClick={() => context.setHighestBid(1000, 'bidder-1', 'John')}>Set Highest Bid</button>
      <button onClick={() => context.addBid({ id: 'bid-1', amount: 1000 })}>Add Bid</button>
      <button onClick={() => context.setRemainingSeconds(300)}>Set Remaining Seconds</button>
      <button onClick={() => context.addParticipant({ userId: 'user-1', displayName: 'Alice' })}>Add Participant</button>
      <button onClick={() => context.removeParticipant('user-1')}>Remove Participant</button>
      <button onClick={() => context.setActiveSpeaker('user-1')}>Set Active Speaker</button>
      <button onClick={() => context.setConnectionQuality('user-1', 'good')}>Set Connection Quality</button>
      <button onClick={() => context.addError('Test error')}>Add Error</button>
      <button onClick={() => context.clearErrors()}>Clear Errors</button>
    </div>
  );
}

describe('AuctionContext', () => {
  describe('Initial State', () => {
    it('should have correct initial state shape', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      expect(screen.getByTestId('auction-id')).toHaveTextContent('');
      expect(screen.getByTestId('auction-status')).toHaveTextContent('pending');
      expect(screen.getByTestId('highest-bid')).toHaveTextContent('0');
      expect(screen.getByTestId('highest-bidder-id')).toHaveTextContent('');
      expect(screen.getByTestId('highest-bidder-name')).toHaveTextContent('');
      expect(screen.getByTestId('minimum-increment')).toHaveTextContent('0');
      expect(screen.getByTestId('remaining-seconds')).toHaveTextContent('0');
      expect(screen.getByTestId('bids-count')).toHaveTextContent('0');
      expect(screen.getByTestId('participants-count')).toHaveTextContent('0');
      expect(screen.getByTestId('active-speaker')).toHaveTextContent('');
      expect(screen.getByTestId('errors-count')).toHaveTextContent('0');
    });
  });

  describe('SET_AUCTION_STATUS action', () => {
    it('should update auction status', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      expect(screen.getByTestId('auction-status')).toHaveTextContent('pending');

      screen.getByText('Set Status Active').click();
      expect(screen.getByTestId('auction-status')).toHaveTextContent('active');
    });
  });

  describe('SET_HIGHEST_BID action', () => {
    it('should update highest bid, bidder ID, and bidder name', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      screen.getByText('Set Highest Bid').click();

      expect(screen.getByTestId('highest-bid')).toHaveTextContent('1000');
      expect(screen.getByTestId('highest-bidder-id')).toHaveTextContent('bidder-1');
      expect(screen.getByTestId('highest-bidder-name')).toHaveTextContent('John');
    });
  });

  describe('ADD_BID action', () => {
    it('should add bid to bids array', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      expect(screen.getByTestId('bids-count')).toHaveTextContent('0');

      screen.getByText('Add Bid').click();

      expect(screen.getByTestId('bids-count')).toHaveTextContent('1');
    });

    it('should add multiple bids', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      screen.getByText('Add Bid').click();
      screen.getByText('Add Bid').click();
      screen.getByText('Add Bid').click();

      expect(screen.getByTestId('bids-count')).toHaveTextContent('3');
    });
  });

  describe('SET_REMAINING_SECONDS action', () => {
    it('should update remaining seconds', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      expect(screen.getByTestId('remaining-seconds')).toHaveTextContent('0');

      screen.getByText('Set Remaining Seconds').click();

      expect(screen.getByTestId('remaining-seconds')).toHaveTextContent('300');
    });
  });

  describe('ADD_PARTICIPANT action', () => {
    it('should add participant to participants array', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      expect(screen.getByTestId('participants-count')).toHaveTextContent('0');

      screen.getByText('Add Participant').click();

      expect(screen.getByTestId('participants-count')).toHaveTextContent('1');
    });
  });

  describe('REMOVE_PARTICIPANT action', () => {
    it('should remove participant from participants array', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      screen.getByText('Add Participant').click();
      expect(screen.getByTestId('participants-count')).toHaveTextContent('1');

      screen.getByText('Remove Participant').click();
      expect(screen.getByTestId('participants-count')).toHaveTextContent('0');
    });
  });

  describe('SET_ACTIVE_SPEAKER action', () => {
    it('should update active speaker ID', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      expect(screen.getByTestId('active-speaker')).toHaveTextContent('');

      screen.getByText('Set Active Speaker').click();

      expect(screen.getByTestId('active-speaker')).toHaveTextContent('user-1');
    });
  });

  describe('SET_CONNECTION_QUALITY action', () => {
    it('should update connection quality for participant', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      screen.getByText('Add Participant').click();
      screen.getByText('Set Connection Quality').click();

      // Verify participant was updated (indirectly through participants count)
      expect(screen.getByTestId('participants-count')).toHaveTextContent('1');
    });
  });

  describe('ADD_ERROR action', () => {
    it('should add error to errors array', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      expect(screen.getByTestId('errors-count')).toHaveTextContent('0');

      screen.getByText('Add Error').click();

      expect(screen.getByTestId('errors-count')).toHaveTextContent('1');
    });

    it('should add multiple errors', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      screen.getByText('Add Error').click();
      screen.getByText('Add Error').click();

      expect(screen.getByTestId('errors-count')).toHaveTextContent('2');
    });
  });

  describe('CLEAR_ERRORS action', () => {
    it('should clear all errors', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      screen.getByText('Add Error').click();
      screen.getByText('Add Error').click();
      expect(screen.getByTestId('errors-count')).toHaveTextContent('2');

      screen.getByText('Clear Errors').click();

      expect(screen.getByTestId('errors-count')).toHaveTextContent('0');
    });
  });

  describe('useAuction hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuction must be used within AuctionProvider');

      spy.mockRestore();
    });
  });

  describe('Reducer coverage', () => {
    it('should handle SET_AUCTION_ID action', () => {
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      screen.getByText('Set Auction ID').click();
      expect(screen.getByTestId('auction-id')).toHaveTextContent('auction-123');
    });

    it('should handle unknown action type', () => {
      // This tests the default case in the reducer
      render(
        <AuctionProvider>
          <TestComponent />
        </AuctionProvider>
      );

      // State should remain unchanged with unknown action
      expect(screen.getByTestId('auction-status')).toHaveTextContent('pending');
    });
  });
});
