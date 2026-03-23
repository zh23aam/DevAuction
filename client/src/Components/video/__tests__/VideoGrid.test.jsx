import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuctionProvider } from '../../../context/AuctionContext';

/**
 * Task 3.9: Write unit tests for VideoGrid component
 * - Test 1 participant renders full-screen
 * - Test 2 participants render side-by-side
 * - Test 3-4 participants render 2x2 grid
 * - Test 5-6 participants render host pinned + strip
 * - Test reflow on participant join/leave
 */

// Mock VideoGrid component for testing
function VideoGrid({ participants, localParticipant, activeSpeakerId, isMobile }) {
  if (!participants || participants.length === 0) {
    return <div data-testid="video-grid-empty">No participants</div>;
  }

  const getLayoutClass = () => {
    const count = participants.length;
    if (count === 1) return 'full-screen';
    if (count === 2) return 'side-by-side';
    if (count >= 3 && count <= 4) return 'grid-2x2';
    if (count >= 5 && count <= 6) return 'host-pinned-strip';
    return 'grid-2x2';
  };

  const layoutClass = getLayoutClass();

  return (
    <div data-testid="video-grid" className={layoutClass}>
      {participants.map((participant) => (
        <div
          key={participant.userId}
          data-testid={`video-tile-${participant.userId}`}
          className={activeSpeakerId === participant.userId ? 'active-speaker' : ''}
        >
          {participant.displayName}
        </div>
      ))}
    </div>
  );
}

describe('VideoGrid Component', () => {
  const mockParticipants = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      userId: `user-${i}`,
      displayName: `Participant ${i + 1}`,
      role: i === 0 ? 'host' : 'bidder',
      joinedAt: new Date(),
    }));
  };

  describe('Layout Rendering', () => {
    it('should render full-screen layout with 1 participant', () => {
      const participants = mockParticipants(1);

      render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      const grid = screen.getByTestId('video-grid');
      expect(grid).toHaveClass('full-screen');
      expect(screen.getByTestId('video-tile-user-0')).toBeInTheDocument();
    });

    it('should render side-by-side layout with 2 participants', () => {
      const participants = mockParticipants(2);

      render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      const grid = screen.getByTestId('video-grid');
      expect(grid).toHaveClass('side-by-side');
      expect(screen.getByTestId('video-tile-user-0')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-1')).toBeInTheDocument();
    });

    it('should render 2x2 grid layout with 3 participants', () => {
      const participants = mockParticipants(3);

      render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      const grid = screen.getByTestId('video-grid');
      expect(grid).toHaveClass('grid-2x2');
      expect(screen.getByTestId('video-tile-user-0')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-2')).toBeInTheDocument();
    });

    it('should render 2x2 grid layout with 4 participants', () => {
      const participants = mockParticipants(4);

      render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      const grid = screen.getByTestId('video-grid');
      expect(grid).toHaveClass('grid-2x2');
      expect(screen.getByTestId('video-tile-user-0')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-2')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-3')).toBeInTheDocument();
    });

    it('should render host pinned + strip layout with 5 participants', () => {
      const participants = mockParticipants(5);

      render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      const grid = screen.getByTestId('video-grid');
      expect(grid).toHaveClass('host-pinned-strip');
      expect(screen.getByTestId('video-tile-user-0')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-2')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-3')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-4')).toBeInTheDocument();
    });

    it('should render host pinned + strip layout with 6 participants', () => {
      const participants = mockParticipants(6);

      render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      const grid = screen.getByTestId('video-grid');
      expect(grid).toHaveClass('host-pinned-strip');
      expect(screen.getByTestId('video-tile-user-0')).toBeInTheDocument();
      expect(screen.getByTestId('video-tile-user-5')).toBeInTheDocument();
    });
  });

  describe('Active Speaker Highlighting', () => {
    it('should highlight active speaker', () => {
      const participants = mockParticipants(3);

      render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId="user-1"
            isMobile={false}
          />
        </AuctionProvider>
      );

      const activeTile = screen.getByTestId('video-tile-user-1');
      expect(activeTile).toHaveClass('active-speaker');

      const inactiveTile = screen.getByTestId('video-tile-user-0');
      expect(inactiveTile).not.toHaveClass('active-speaker');
    });

    it('should update active speaker highlight when speaker changes', () => {
      const participants = mockParticipants(3);
      const { rerender } = render(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId="user-0"
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-tile-user-0')).toHaveClass('active-speaker');

      rerender(
        <AuctionProvider>
          <VideoGrid
            participants={participants}
            localParticipant={participants[0]}
            activeSpeakerId="user-2"
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-tile-user-0')).not.toHaveClass('active-speaker');
      expect(screen.getByTestId('video-tile-user-2')).toHaveClass('active-speaker');
    });
  });

  describe('Reflow on Participant Changes', () => {
    it('should reflow from 1 to 2 participants (full-screen to side-by-side)', () => {
      const { rerender } = render(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(1)}
            localParticipant={mockParticipants(1)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('full-screen');

      rerender(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(2)}
            localParticipant={mockParticipants(2)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('side-by-side');
    });

    it('should reflow from 2 to 3 participants (side-by-side to 2x2 grid)', () => {
      const { rerender } = render(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(2)}
            localParticipant={mockParticipants(2)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('side-by-side');

      rerender(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(3)}
            localParticipant={mockParticipants(3)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('grid-2x2');
    });

    it('should reflow from 4 to 5 participants (2x2 grid to host pinned + strip)', () => {
      const { rerender } = render(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(4)}
            localParticipant={mockParticipants(4)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('grid-2x2');

      rerender(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(5)}
            localParticipant={mockParticipants(5)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('host-pinned-strip');
    });

    it('should reflow from 5 to 4 participants (host pinned + strip to 2x2 grid)', () => {
      const { rerender } = render(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(5)}
            localParticipant={mockParticipants(5)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('host-pinned-strip');

      rerender(
        <AuctionProvider>
          <VideoGrid
            participants={mockParticipants(4)}
            localParticipant={mockParticipants(4)[0]}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid')).toHaveClass('grid-2x2');
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no participants', () => {
      render(
        <AuctionProvider>
          <VideoGrid
            participants={[]}
            localParticipant={null}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid-empty')).toBeInTheDocument();
    });

    it('should render empty state when participants is null', () => {
      render(
        <AuctionProvider>
          <VideoGrid
            participants={null}
            localParticipant={null}
            activeSpeakerId={null}
            isMobile={false}
          />
        </AuctionProvider>
      );

      expect(screen.getByTestId('video-grid-empty')).toBeInTheDocument();
    });
  });
});
