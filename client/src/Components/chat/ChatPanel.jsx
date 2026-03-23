import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from './ChatMessage';

/**
 * ChatPanel Component
 * Displays message list with auto-scroll to latest
 * Renders message input form
 * Submits message via Socket.io chat:message event
 * Displays system messages
 * Allows host to delete messages
 * Disables input for observers
 * Shows last 50 messages on load (late joiner support)
 * 
 * Validates: Requirements 28, 29, 30, 31
 */
function ChatPanel({
  messages,
  userRole,
  auctionStatus,
  onSendMessage,
  onDeleteMessage,
}) {
  const [messageInput, setMessageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      if (!messageInput.trim() || isSubmitting) {
        return;
      }

      // Disable input for observers
      if (userRole === 'observer') {
        return;
      }

      setIsSubmitting(true);
      try {
        if (onSendMessage) {
          await onSendMessage(messageInput.trim());
        }
        setMessageInput('');
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [messageInput, isSubmitting, userRole, onSendMessage]
  );

  const handleDeleteMessage = useCallback(
    (messageId) => {
      if (onDeleteMessage && userRole === 'host') {
        onDeleteMessage(messageId);
      }
    },
    [userRole, onDeleteMessage]
  );

  const isInputDisabled = userRole === 'observer' || auctionStatus === 'ended';

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800 shrink-0">
        <h3 className="text-white font-semibold text-sm">Chat</h3>
        <span className="text-gray-500 text-xs">{messages.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto" ref={messageListRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id || index}
                message={message}
                isSystemMessage={message.isSystemMessage}
                isDeleted={message.isDeleted}
                userRole={userRole}
                onDelete={() => handleDeleteMessage(message.id)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form className="flex gap-2 px-3 py-2 border-t border-gray-800 bg-gray-900 shrink-0" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="flex-1 bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          placeholder={
            isInputDisabled
              ? userRole === 'observer'
                ? 'Observers cannot send messages'
                : 'Auction ended'
              : 'Type a message...'
          }
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={isInputDisabled}
          maxLength={500}
        />
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          disabled={isInputDisabled || !messageInput.trim() || isSubmitting}
          title={isInputDisabled ? 'Cannot send messages' : 'Send message'}
        >
          {isSubmitting ? '...' : '→'}
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;
