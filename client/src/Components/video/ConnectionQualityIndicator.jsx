import React from 'react';
import './ConnectionQualityIndicator.css';

/**
 * ConnectionQualityIndicator Component
 * 
 * Displays signal strength bars (1-4 bars) indicating connection quality.
 * Updates in real-time as connection conditions change.
 * 
 * Satisfies: Requirement 9 (Connection Quality Indicator)
 */
function ConnectionQualityIndicator({ quality = 'unknown' }) {
  // Map quality to number of bars (1-4)
  const getBarCount = (q) => {
    switch (q) {
      case 'excellent':
        return 4;
      case 'good':
        return 3;
      case 'poor':
        return 2;
      case 'unknown':
      default:
        return 1;
    }
  };

  // Map quality to color
  const getQualityColor = (q) => {
    switch (q) {
      case 'excellent':
        return '#10b981'; // green
      case 'good':
        return '#3b82f6'; // blue
      case 'poor':
        return '#f59e0b'; // amber
      case 'unknown':
      default:
        return '#6b7280'; // gray
    }
  };

  const barCount = getBarCount(quality);
  const color = getQualityColor(quality);

  return (
    <div className="connection-quality-indicator">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`connection-quality-indicator__bar ${
            bar <= barCount ? 'connection-quality-indicator__bar--active' : ''
          }`}
          style={{
            backgroundColor: bar <= barCount ? color : 'rgba(255, 255, 255, 0.2)',
          }}
        />
      ))}
    </div>
  );
}

export default ConnectionQualityIndicator;
