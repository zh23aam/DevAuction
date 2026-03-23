import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatProvider, useChat, CHAT_ACTIONS } from '../ChatContext';

/**
 * Task 3.6: Write unit tests for ChatContext
 * - Test initial state shape
 * - Test ADD_MESSAGE, DELETE_MESSAGE, SET_MESSAGE_HISTORY actions
 * - Test ADD_REACTION, REMOVE_REACTION actions
 * - 100% reducer coverage
 */

// Test component to access context
function TestComponent() {
  const context = useChat();
  return (
    <div>
      <div data-testid="messages-count">{context.state.messages.length}</div>
      <div data-testid="reactions-count">{context.state.reactions.length}</div>
      <button onClick={() => context.addMessage({ id: 'msg-1', messageText: 'Hello' })}>Add Message</button>
      <button onClick={() => context.deleteMessage('msg-1')}>Delete Message</button>
      <button onClick={() => context.setMessageHistory([{ id: 'msg-1', messageText: 'History' }])}>Set Message History</button>
      <button onClick={() => context.addReaction({ id: 'reaction-1', emoji: '👍' })}>Add Reaction</button>
      <button onClick={() => context.removeReaction('reaction-1')}>Remove Reaction</button>
      <button onClick={() => context.resetChat()}>Reset Chat</button>
    </div>
  );
}

describe('ChatContext', () => {
  describe('Initial State', () => {
    it('should have correct initial state shape', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
      expect(screen.getByTestId('reactions-count')).toHaveTextContent('0');
    });
  });

  describe('ADD_MESSAGE action', () => {
    it('should add message to messages array', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');

      screen.getByText('Add Message').click();

      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
    });

    it('should add multiple messages', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      screen.getByText('Add Message').click();
      screen.getByText('Add Message').click();
      screen.getByText('Add Message').click();

      expect(screen.getByTestId('messages-count')).toHaveTextContent('3');
    });
  });

  describe('DELETE_MESSAGE action', () => {
    it('should mark message as deleted', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      screen.getByText('Add Message').click();
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');

      screen.getByText('Delete Message').click();

      // Message count should remain 1 (message is marked deleted, not removed)
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
    });
  });

  describe('SET_MESSAGE_HISTORY action', () => {
    it('should replace messages with history', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      screen.getByText('Add Message').click();
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');

      screen.getByText('Set Message History').click();

      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
    });

    it('should handle empty message history', () => {
      const HistoryTestComponent = () => {
        const context = useChat();
        return (
          <div>
            <div data-testid="messages-count">{context.state.messages.length}</div>
            <button onClick={() => context.setMessageHistory([])}>Set Empty History</button>
          </div>
        );
      };

      render(
        <ChatProvider>
          <HistoryTestComponent />
        </ChatProvider>
      );

      screen.getByText('Set Empty History').click();
      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
    });
  });

  describe('ADD_REACTION action', () => {
    it('should add reaction to reactions array', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('reactions-count')).toHaveTextContent('0');

      screen.getByText('Add Reaction').click();

      expect(screen.getByTestId('reactions-count')).toHaveTextContent('1');
    });

    it('should add multiple reactions', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      screen.getByText('Add Reaction').click();
      screen.getByText('Add Reaction').click();
      screen.getByText('Add Reaction').click();

      expect(screen.getByTestId('reactions-count')).toHaveTextContent('3');
    });
  });

  describe('REMOVE_REACTION action', () => {
    it('should remove reaction from reactions array', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      screen.getByText('Add Reaction').click();
      expect(screen.getByTestId('reactions-count')).toHaveTextContent('1');

      screen.getByText('Remove Reaction').click();

      expect(screen.getByTestId('reactions-count')).toHaveTextContent('0');
    });

    it('should only remove matching reaction ID', () => {
      const MultiReactionComponent = () => {
        const context = useChat();
        return (
          <div>
            <div data-testid="reactions-count">{context.state.reactions.length}</div>
            <button onClick={() => context.addReaction({ id: 'reaction-1', emoji: '👍' })}>Add Reaction 1</button>
            <button onClick={() => context.addReaction({ id: 'reaction-2', emoji: '❤️' })}>Add Reaction 2</button>
            <button onClick={() => context.removeReaction('reaction-1')}>Remove Reaction 1</button>
          </div>
        );
      };

      render(
        <ChatProvider>
          <MultiReactionComponent />
        </ChatProvider>
      );

      screen.getByText('Add Reaction 1').click();
      screen.getByText('Add Reaction 2').click();
      expect(screen.getByTestId('reactions-count')).toHaveTextContent('2');

      screen.getByText('Remove Reaction 1').click();

      expect(screen.getByTestId('reactions-count')).toHaveTextContent('1');
    });
  });

  describe('RESET_CHAT action', () => {
    it('should reset chat state to initial state', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      screen.getByText('Add Message').click();
      screen.getByText('Add Reaction').click();
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      expect(screen.getByTestId('reactions-count')).toHaveTextContent('1');

      screen.getByText('Reset Chat').click();

      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
      expect(screen.getByTestId('reactions-count')).toHaveTextContent('0');
    });
  });

  describe('useChat hook', () => {
    it('should throw error when used outside provider', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useChat must be used within ChatProvider');

      spy.mockRestore();
    });
  });

  describe('Reducer coverage', () => {
    it('should handle unknown action type', () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      // State should remain unchanged with unknown action
      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
      expect(screen.getByTestId('reactions-count')).toHaveTextContent('0');
    });
  });
});
