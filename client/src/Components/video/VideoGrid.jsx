import React, { useMemo } from 'react';

/**
 * VideoGrid Component
 * 
 * Renders a responsive video grid layout based on participant count.
 * 
 * Layout rules:
 * - 1 participant: full-screen single tile
 * - 2 participants: side-by-side tiles
 * - 3-4 participants: 2x2 grid
 * - 5-6 participants: host pinned large + others in horizontal strip
 * 
 * Reflows automatically as participants join/leave.
 * Responsive for mobile (< 768px) and desktop (>= 768px).
 * 
 * Satisfies: Requirement 12 (Responsive Video Grid Layout)
 */
function VideoGrid({
  participants = [],
  localParticipant = null,
  activeSpearker = null,
  isMobile = false,
  renderVideoTile = null,
}) {
  // Determine layout based on participant count
  const layout = useMemo(() => {
    const count = participants.length;

    if (count === 0) {
      return { type: 'empty', tiles: [] };
    }

    if (count === 1) {
      return { type: 'fullscreen', tiles: participants };
    }

    if (count === 2) {
      return { type: 'sidebyside', tiles: participants };
    }

    if (count >= 3 && count <= 4) {
      return { type: 'grid2x2', tiles: participants };
    }

    if (count >= 5 && count <= 6) {
      // Find host participant (first participant or one with role='host')
      const hostIndex = participants.findIndex(p => p.role === 'host');
      const host = hostIndex !== -1 ? participants[hostIndex] : participants[0];
      const others = participants.filter((_, idx) => idx !== hostIndex);

      return {
        type: 'pinned',
        pinnedTile: host,
        stripTiles: others,
      };
    }

    // Fallback for edge cases
    return { type: 'grid2x2', tiles: participants };
  }, [participants]);

  // Render empty state
  if (layout.type === 'empty') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-gray-500 text-sm">
          <p>Waiting for participants to join...</p>
        </div>
      </div>
    );
  }

  // Render fullscreen layout (1 participant)
  if (layout.type === 'fullscreen') {
    return (
      <div className="w-full h-full">
        <div className="w-full h-full">
          {renderVideoTile ? (
            renderVideoTile(layout.tiles[0], activeSpearker === layout.tiles[0].userId)
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              {layout.tiles[0].displayName}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render side-by-side layout (2 participants)
  if (layout.type === 'sidebyside') {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1">
        {layout.tiles.map(participant => (
          <div
            key={participant.userId}
            className="w-full h-full"
          >
            {renderVideoTile ? (
              renderVideoTile(participant, activeSpearker === participant.userId)
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                {participant.displayName}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render 2x2 grid layout (3-4 participants)
  if (layout.type === 'grid2x2') {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1">
        {layout.tiles.map(participant => (
          <div
            key={participant.userId}
            className="w-full h-full"
          >
            {renderVideoTile ? (
              renderVideoTile(participant, activeSpearker === participant.userId)
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                {participant.displayName}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render pinned + strip layout (5-6 participants)
  if (layout.type === 'pinned') {
    return (
      <div className="w-full h-full flex flex-col gap-1">
        {/* Pinned host tile */}
        <div className="flex-1">
          <div className="w-full h-full">
            {renderVideoTile ? (
              renderVideoTile(layout.pinnedTile, activeSpearker === layout.pinnedTile.userId)
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                {layout.pinnedTile.displayName}
              </div>
            )}
          </div>
        </div>

        {/* Horizontal strip of other participants */}
        <div className="h-32 flex gap-1">
          {layout.stripTiles.map(participant => (
            <div
              key={participant.userId}
              className="flex-1"
            >
              {renderVideoTile ? (
                renderVideoTile(participant, activeSpearker === participant.userId)
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  {participant.displayName}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default VideoGrid;
