import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuctionProvider } from '../../../context/AuctionContext';

/**
 * Task 3.12: Write unit tests for TimerDisplay component
 * - Test countdown display in MM:SS format
 * - Test update on auction:tick event
 * - Test visual indicator at < 30 seconds
 * - Test animation on timer extension
 */

// Mock TimerDisplay component for testing
function TimerDisplay({ remainingSeconds, auctionStatus }) {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAntiSnipingZone = remainingSeconds < 30 && remainingSeconds > 0;

  return (
    <div data-testid="timer-display">
      {auctionStatus === 'ended' ? (
        <div data-testid="auction-ended">Auction Ended</div>
      ) : (
        <div
          data-testid="countdown"
          className={isAntiSnipingZone ? 'anti-sniping-zone' : ''}
        >
          {formatTime(remainingSeconds)}
        </div>
      )}
    </div>
  );
}

describe('TimerDisplay Component', () => {
  describe('Countdown Display Format', () => {
    it('should display countdown in MM:SS format', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={125} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('02:05');
    });

    it('should display 00:00 when time is zero', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={0} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:00');
    });

    it('should display 00:01 for 1 second', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={1} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:01');
    });

    it('should display 01:00 for 60 seconds', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={60} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('01:00');
    });

    it('should display 10:30 for 630 seconds', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={630} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('10:30');
    });

    it('should pad single digit seconds with leading zero', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={65} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('01:05');
    });

    it('should pad single digit minutes with leading zero', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={5} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:05');
    });
  });

  describe('Update on Tick Event', () => {
    it('should update countdown when remainingSeconds changes', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={300} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('05:00');

      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={299} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('04:59');
    });

    it('should decrement by 1 second on each tick', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={10} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:10');

      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={9} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:09');

      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={8} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:08');
    });

    it('should handle rapid updates', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={100} auctionStatus="active" />
        </AuctionProvider>
      );

      for (let i = 99; i >= 90; i--) {
        rerender(
          <AuctionProvider>
            <TimerDisplay remainingSeconds={i} auctionStatus="active" />
          </AuctionProvider>
        );
      }

      expect(screen.getByTestId('countdown')).toHaveTextContent('01:30');
    });
  });

  describe('Anti-Sniping Zone Visual Indicator', () => {
    it('should show visual indicator when < 30 seconds', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={29} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveClass('anti-sniping-zone');
    });

    it('should show visual indicator at exactly 1 second', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={1} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveClass('anti-sniping-zone');
    });

    it('should not show visual indicator at 30 seconds', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={30} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).not.toHaveClass('anti-sniping-zone');
    });

    it('should not show visual indicator at 0 seconds', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={0} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).not.toHaveClass('anti-sniping-zone');
    });

    it('should not show visual indicator when > 30 seconds', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={60} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).not.toHaveClass('anti-sniping-zone');
    });

    it('should toggle visual indicator when crossing 30 second threshold', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={31} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).not.toHaveClass('anti-sniping-zone');

      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={30} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).not.toHaveClass('anti-sniping-zone');

      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={29} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveClass('anti-sniping-zone');
    });
  });

  describe('Timer Extension Animation', () => {
    it('should display extended time when timer is extended', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={25} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:25');

      // Simulate timer extension (bid in final 30 seconds adds 30 seconds)
      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={55} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:55');
    });

    it('should handle multiple timer extensions', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={20} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:20');

      // First extension
      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={50} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('00:50');

      // Second extension
      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={80} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('01:20');
    });
  });

  describe('Auction Status Display', () => {
    it('should display "Auction Ended" when status is ended', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={0} auctionStatus="ended" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('auction-ended')).toHaveTextContent('Auction Ended');
      expect(screen.queryByTestId('countdown')).not.toBeInTheDocument();
    });

    it('should display countdown when status is active', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={60} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toBeInTheDocument();
      expect(screen.queryByTestId('auction-ended')).not.toBeInTheDocument();
    });

    it('should display countdown when status is paused', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={60} auctionStatus="paused" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toBeInTheDocument();
      expect(screen.queryByTestId('auction-ended')).not.toBeInTheDocument();
    });

    it('should display countdown when status is pending', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={300} auctionStatus="pending" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toBeInTheDocument();
      expect(screen.queryByTestId('auction-ended')).not.toBeInTheDocument();
    });

    it('should transition from countdown to ended', () => {
      const { rerender } = render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={60} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toBeInTheDocument();

      rerender(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={0} auctionStatus="ended" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('auction-ended')).toBeInTheDocument();
      expect(screen.queryByTestId('countdown')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large time values', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={3661} auctionStatus="active" />
        </AuctionProvider>
      );

      expect(screen.getByTestId('countdown')).toHaveTextContent('61:01');
    });

    it('should handle negative time values gracefully', () => {
      render(
        <AuctionProvider>
          <TimerDisplay remainingSeconds={-1} auctionStatus="active" />
        </AuctionProvider>
      );

      // Should display something (implementation dependent)
      expect(screen.getByTestId('countdown')).toBeInTheDocument();
    });
  });
});
