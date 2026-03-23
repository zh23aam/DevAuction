import React, { createContext, useReducer, useCallback } from 'react';

/**
 * ChatContext
 * Manages chat state including messages and reactions
 */
export const ChatContext = createContext();

/**
 * Initial state shape
 */
const initialState = {
  messages: [],
  reactions: [],
};

/**
 * Action types
 */
export const CHAT_ACTIONS = {
  ADD_MESSAGE: 'ADD_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  SET_MESSAGE_HISTORY: 'SET_MESSAGE_HISTORY',
  ADD_REACTION: 'ADD_REACTION',
  REMOVE_REACTION: 'REMOVE_REACTION',
  RESET_CHAT: 'RESET_CHAT',
};

/**
 * Reducer function
 */
function chatReducer(state, action) {
  switch (action.type) {
    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case CHAT_ACTIONS.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload
            ? { ...msg, isDeleted: true }
            : msg
        ),
      };

    case CHAT_ACTIONS.SET_MESSAGE_HISTORY:
      return {
        ...state,
        messages: action.payload,
      };

    case CHAT_ACTIONS.ADD_REACTION:
      return {
        ...state,
        reactions: [...state.reactions, action.payload],
      };

    case CHAT_ACTIONS.REMOVE_REACTION:
      return {
        ...state,
        reactions: state.reactions.filter(r => r.id !== action.payload),
      };

    case CHAT_ACTIONS.RESET_CHAT:
      return initialState;

    default:
      return state;
  }
}

/**
 * ChatProvider component
 */
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Action creators for convenience
  const addMessage = useCallback((message) => {
    dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: message });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    dispatch({ type: CHAT_ACTIONS.DELETE_MESSAGE, payload: messageId });
  }, []);

  const setMessageHistory = useCallback((messages) => {
    dispatch({ type: CHAT_ACTIONS.SET_MESSAGE_HISTORY, payload: messages });
  }, []);

  const addReaction = useCallback((reaction) => {
    dispatch({ type: CHAT_ACTIONS.ADD_REACTION, payload: reaction });
  }, []);

  const removeReaction = useCallback((reactionId) => {
    dispatch({ type: CHAT_ACTIONS.REMOVE_REACTION, payload: reactionId });
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.RESET_CHAT });
  }, []);

  const value = {
    state,
    addMessage,
    deleteMessage,
    setMessageHistory,
    addReaction,
    removeReaction,
    resetChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Custom hook to use ChatContext
 */
export function useChat() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
