import React, { useEffect, useState } from 'react';
import './FloatingReaction.css';

/**
 * FloatingReaction Component
 * Renders emoji with floating upward animation
 * Adds random horizontal drift
 * Fades out after 2 seconds
 * Removes from DOM on animation complete
 * Renders multiple reactions independently
 * 
 * Validates: Requirement 32
 */
function FloatingReaction({ emoji, onComplete, id }) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animation duration: 2 seconds
    const timer = setTimeout(() => {
      setIsAnimating(false);
      if (onComplete) {
        onComplete(id);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [id, onComplete]);

  // Random horizontal drift between -30px and 30px
  const randomDrift = Math.random() * 60 - 30;

  return (
    <div
      className="floating-reaction"
      style={{
        '--drift': `${randomDrift}px`,
      }}
    >
      <span className="reaction-emoji">{emoji}</span>
    </div>
  );
}

export default FloatingReaction;
