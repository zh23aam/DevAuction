import React from 'react';
import './ChatMessage.css';

/**
 * ChatMessage Component
 * Renders message text with sender name and timestamp
 * Shows "[Message deleted by host]" for deleted messages
 * Renders system messages in italics/different color
 * Shows delete button for host only
 * Handles delete click
 * 
 * Validates: Requirements 28, 30, 31
 */
function ChatMessage({
  message,
  isSystemMessage,
  isDeleted,
  userRole,
  onDelete,
}) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isSystemMessage) {
    return (
      <div className="chat-message system-message">
        <p className="system-text">{message.messageText}</p>
        <span className="message-time">{formatTime(message.serverTimestamp)}</span>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div className="chat-message deleted-message">
        <div className="message-header">
          <span className="sender-name">{message.senderName || 'Unknown'}</span>
          <span className="message-time">{formatTime(message.serverTimestamp)}</span>
        </div>
        <p className="deleted-text">[Message deleted by host]</p>
      </div>
    );
  }

  return (
    <div className="chat-message user-message">
      <div className="message-header">
        <span className="sender-name">{message.senderName || 'Unknown'}</span>
        <span className="message-time">{formatTime(message.serverTimestamp)}</span>
      </div>
      <p className="message-text">{message.messageText}</p>
      {userRole === 'host' && (
        <button
          className="delete-btn"
          onClick={onDelete}
          title="Delete message"
          aria-label="Delete message"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default ChatMessage;
