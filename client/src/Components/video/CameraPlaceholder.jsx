import React from 'react';

/**
 * CameraPlaceholder Component
 * 
 * Displays participant initials on a colored background when camera is off.
 * 
 * Satisfies: Requirement 7 (Camera-Off Placeholder Display)
 */
function CameraPlaceholder({ displayName = 'Unknown', backgroundColor = '#667eea' }) {
  // Extract initials from display name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(displayName);

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor }}
    >
      <span className="text-white text-4xl font-bold">{initials}</span>
    </div>
  );
}

export default CameraPlaceholder;
