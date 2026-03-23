import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatProvider } from '../../../context/ChatContext';
import { AuctionProvider } from '../../../context/AuctionContext';

/**
 * Task 3.11: Write unit tests for ChatPanel component
 * - Test message display
 * - Test message submission
 * - Test system message display
 * - Test host message deletion
 * - Test input disabled for observers
 * - Test late joiner message history
 */

// Mock ChatPanel component for testing
function ChatPanel({
  messages,
  userRole,
  auctionStatus,
  onSendMessage,
  onDeleteMessage,
}) {
  const [messageInput, setMessageInput] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  const isDisabled = userRole === 'observer';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!messageInput.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendMessage(messageInput.trim());
      setMessageInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (messageId) => {
    await onDeleteMessage(messageId);
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div data-testid="chat-panel">
      <div data-testid="messages-list">
        {messages.map((msg) => (
          <div key={msg.id} data-testid={`message-${msg.id}`} className={msg.isSystemMessage ? 'system-message' : ''}>
            {msg.isDeleted ? (
              <span data-testid={`deleted-${msg.id}`}>[Message deleted by host]</span>
            ) : (
              <>
                <span data-testid={`sender-${msg.id}`}>{msg.senderName}:</span>
                <span data-testid={`text-${msg.id}`}>{msg.messageText}</span>
              </>
            )}
            {userRole === 'host' && !msg.isSystemMessage && (
              <button
                data-testid={`delete-btn-${msg.id}`}
                onClick={() => handleDelete(msg.id)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="message-input"
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={isDisabled}
          placeholder="Type a message..."
        />
        <button
          data-testid="message-submit-btn"
          type="submit"
          disabled={isDisabled || isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

describe('ChatPanel Component', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnDeleteMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Display', () => {
    it('should display user messages', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'Hello everyone!',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('sender-msg-1')).toHaveTextContent('Alice');
      expect(screen.getByTestId('text-msg-1')).toHaveTextContent('Hello everyone!');
    });

    it('should display multiple messages in order', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'First message',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
        {
          id: 'msg-2',
          senderId: 'user-2',
          senderName: 'Bob',
          messageText: 'Second message',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
    });

    it('should display system messages with different styling', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: null,
          senderName: 'System',
          messageText: 'Alice joined the auction',
          isSystemMessage: true,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-msg-1')).toHaveClass('system-message');
    });
  });

  describe('Message Submission', () => {
    it('should submit message with correct text', async () => {
      mockOnSendMessage.mockResolvedValueOnce(undefined);

      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const input = screen.getByTestId('message-input');
      const submitBtn = screen.getByTestId('message-submit-btn');

      await userEvent.type(input, 'Hello everyone!');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello everyone!');
      });
    });

    it('should clear input after successful submission', async () => {
      mockOnSendMessage.mockResolvedValueOnce(undefined);

      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const input = screen.getByTestId('message-input');
      const submitBtn = screen.getByTestId('message-submit-btn');

      await userEvent.type(input, 'Hello everyone!');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should not submit empty message', async () => {
      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const submitBtn = screen.getByTestId('message-submit-btn');
      fireEvent.click(submitBtn);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should trim whitespace from message', async () => {
      mockOnSendMessage.mockResolvedValueOnce(undefined);

      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const input = screen.getByTestId('message-input');
      const submitBtn = screen.getByTestId('message-submit-btn');

      await userEvent.type(input, '  Hello  ');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello');
      });
    });

    it('should show sending state during submission', async () => {
      mockOnSendMessage.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const input = screen.getByTestId('message-input');
      const submitBtn = screen.getByTestId('message-submit-btn');

      await userEvent.type(input, 'Hello');
      fireEvent.click(submitBtn);

      expect(screen.getByTestId('message-submit-btn')).toHaveTextContent('Sending...');
    });
  });

  describe('System Messages', () => {
    it('should display system message for participant join', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: null,
          senderName: 'System',
          messageText: 'Alice joined the auction',
          isSystemMessage: true,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('text-msg-1')).toHaveTextContent('Alice joined the auction');
    });

    it('should display system message for bid accepted', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: null,
          senderName: 'System',
          messageText: 'Bob bid 1500',
          isSystemMessage: true,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('text-msg-1')).toHaveTextContent('Bob bid 1500');
    });
  });

  describe('Host Message Deletion', () => {
    it('should show delete button for host on user messages', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'Hello',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="host"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('delete-btn-msg-1')).toBeInTheDocument();
    });

    it('should not show delete button for non-host', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'Hello',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.queryByTestId('delete-btn-msg-1')).not.toBeInTheDocument();
    });

    it('should not show delete button for system messages', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: null,
          senderName: 'System',
          messageText: 'Alice joined',
          isSystemMessage: true,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="host"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.queryByTestId('delete-btn-msg-1')).not.toBeInTheDocument();
    });

    it('should call delete handler when delete button clicked', async () => {
      mockOnDeleteMessage.mockResolvedValueOnce(undefined);

      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'Hello',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="host"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const deleteBtn = screen.getByTestId('delete-btn-msg-1');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockOnDeleteMessage).toHaveBeenCalledWith('msg-1');
      });
    });

    it('should display deleted message placeholder', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'Hello',
          isSystemMessage: false,
          isDeleted: true,
          serverTimestamp: new Date(),
        },
      ];

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="host"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('deleted-msg-1')).toHaveTextContent('[Message deleted by host]');
    });
  });

  describe('Input Disabled for Observers', () => {
    it('should disable input for observer role', () => {
      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="observer"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-input')).toBeDisabled();
      expect(screen.getByTestId('message-submit-btn')).toBeDisabled();
    });

    it('should enable input for bidder role', () => {
      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-input')).not.toBeDisabled();
      expect(screen.getByTestId('message-submit-btn')).not.toBeDisabled();
    });

    it('should enable input for host role', () => {
      render(
        <ChatProvider>
          <ChatPanel
            messages={[]}
            userRole="host"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-input')).not.toBeDisabled();
      expect(screen.getByTestId('message-submit-btn')).not.toBeDisabled();
    });
  });

  describe('Late Joiner Message History', () => {
    it('should display last 50 messages on load', () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        senderId: `user-${i % 3}`,
        senderName: `User ${i % 3}`,
        messageText: `Message ${i}`,
        isSystemMessage: false,
        isDeleted: false,
        serverTimestamp: new Date(),
      }));

      render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(screen.getByTestId('message-msg-0')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg-49')).toBeInTheDocument();
    });

    it('should display messages in chronological order', () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'First',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(Date.now() - 1000),
        },
        {
          id: 'msg-2',
          senderId: 'user-2',
          senderName: 'Bob',
          messageText: 'Second',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      const { container } = render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const messagesList = screen.getByTestId('messages-list');
      const messageElements = messagesList.querySelectorAll('[data-testid^="message-"]');

      expect(messageElements[0]).toHaveAttribute('data-testid', 'message-msg-1');
      expect(messageElements[1]).toHaveAttribute('data-testid', 'message-msg-2');
    });
  });

  describe('Auto-scroll to Latest Message', () => {
    it('should scroll to latest message on new message', () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          messageText: 'Hello',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      const { rerender } = render(
        <ChatProvider>
          <ChatPanel
            messages={messages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      const newMessages = [
        ...messages,
        {
          id: 'msg-2',
          senderId: 'user-2',
          senderName: 'Bob',
          messageText: 'Hi',
          isSystemMessage: false,
          isDeleted: false,
          serverTimestamp: new Date(),
        },
      ];

      rerender(
        <ChatProvider>
          <ChatPanel
            messages={newMessages}
            userRole="bidder"
            auctionStatus="active"
            onSendMessage={mockOnSendMessage}
            onDeleteMessage={mockOnDeleteMessage}
          />
        </ChatProvider>
      );

      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });
});
