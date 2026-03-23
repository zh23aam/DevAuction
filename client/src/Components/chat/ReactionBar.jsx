import React, { useCallback } from 'react';

/**
 * ReactionBar Component
 * Displays predefined emoji buttons (👍 ❤️ 😂 🔥 👏)
 * Emits chat:reaction event on click
 * Disables during non-active auction status
 * 
 * Validates: Requirement 32
 */
function ReactionBar({ auctionStatus, onReaction }) {
  const reactions = [
    { emoji: '👍', label: 'Thumbs Up' },
    { emoji: '❤️', label: 'Heart' },
    { emoji: '😂', label: 'Laughing' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '👏', label: 'Clapping' },
  ];

  const isDisabled = auctionStatus !== 'active';

  const handleReactionClick = useCallback(
    (emoji) => {
      if (!isDisabled && onReaction) {
        onReaction(emoji);
      }
    },
    [isDisabled, onReaction]
  );

  return (
    <div className={`flex flex-col gap-2 ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="flex gap-2 justify-center">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-lg transition-colors disabled:cursor-not-allowed"
            onClick={() => handleReactionClick(reaction.emoji)}
            disabled={isDisabled}
            title={reaction.label}
            aria-label={reaction.label}
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
      {isDisabled && (
        <span className="text-center text-gray-500 text-xs">Reactions disabled</span>
      )}
    </div>
  );
}

export default ReactionBar;
