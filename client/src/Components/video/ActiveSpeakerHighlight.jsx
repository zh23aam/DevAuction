import React from 'react';
import './ActiveSpeakerHighlight.css';

/**
 * ActiveSpeakerHighlight Component
 * 
 * Applies visual highlight (border/glow effect) when participant is the active speaker.
 * Updates within 500ms of the activeSpeakersChanged event.
 * 
 * Satisfies: Requirement 8 (Active Speaker Highlighting)
 */
function ActiveSpeakerHighlight({ isActive = false }) {
  return (
    <div
      className={`active-speaker-highlight ${
        isActive ? 'active-speaker-highlight--active' : ''
      }`}
    />
  );
}

export default ActiveSpeakerHighlight;
