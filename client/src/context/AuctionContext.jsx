import React, { createContext, useReducer, useCallback } from 'react';

/**
 * AuctionContext
 * Manages auction state including bids, participants, timer, and errors
 */
export const AuctionContext = createContext();

/**
 * Initial state shape
 */
const initialState = {
  auctionId: null,
  auctionStatus: 'pending', // pending, active, paused, ended
  currentHighestBid: 0,
  highestBidderId: null,
  highestBidderName: null,
  minimumIncrement: 0,
  remainingSeconds: 0,
  bids: [],
  participants: [],
  localParticipant: null,
  activeSpeakerId: null,
  errors: [],
};

/**
 * Action types
 */
export const AUCTION_ACTIONS = {
  SET_AUCTION_ID: 'SET_AUCTION_ID',
  SET_AUCTION_STATUS: 'SET_AUCTION_STATUS',
  SET_HIGHEST_BID: 'SET_HIGHEST_BID',
  ADD_BID: 'ADD_BID',
  SET_REMAINING_SECONDS: 'SET_REMAINING_SECONDS',
  ADD_PARTICIPANT: 'ADD_PARTICIPANT',
  REMOVE_PARTICIPANT: 'REMOVE_PARTICIPANT',
  SET_ACTIVE_SPEAKER: 'SET_ACTIVE_SPEAKER',
  SET_CONNECTION_QUALITY: 'SET_CONNECTION_QUALITY',
  ADD_ERROR: 'ADD_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_LOCAL_PARTICIPANT: 'SET_LOCAL_PARTICIPANT',
  RESET_AUCTION: 'RESET_AUCTION',
};

/**
 * Reducer function
 */
function auctionReducer(state, action) {
  switch (action.type) {
    case AUCTION_ACTIONS.SET_AUCTION_ID:
      return {
        ...state,
        auctionId: action.payload,
      };

    case AUCTION_ACTIONS.SET_AUCTION_STATUS:
      return {
        ...state,
        auctionStatus: action.payload,
      };

    case AUCTION_ACTIONS.SET_HIGHEST_BID:
      return {
        ...state,
        currentHighestBid: action.payload.amount,
        highestBidderId: action.payload.bidderId,
        highestBidderName: action.payload.bidderName,
      };

    case AUCTION_ACTIONS.ADD_BID:
      return {
        ...state,
        bids: [...state.bids, action.payload],
      };

    case AUCTION_ACTIONS.SET_REMAINING_SECONDS:
      return {
        ...state,
        remainingSeconds: action.payload,
      };

    case AUCTION_ACTIONS.ADD_PARTICIPANT:
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };

    case AUCTION_ACTIONS.REMOVE_PARTICIPANT:
      return {
        ...state,
        participants: state.participants.filter(p => p.userId !== action.payload),
      };

    case AUCTION_ACTIONS.SET_ACTIVE_SPEAKER:
      return {
        ...state,
        activeSpeakerId: action.payload,
      };

    case AUCTION_ACTIONS.SET_CONNECTION_QUALITY:
      return {
        ...state,
        participants: state.participants.map(p =>
          p.userId === action.payload.userId
            ? { ...p, connectionQuality: action.payload.quality }
            : p
        ),
      };

    case AUCTION_ACTIONS.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload],
      };

    case AUCTION_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: [],
      };

    case AUCTION_ACTIONS.SET_LOCAL_PARTICIPANT:
      return {
        ...state,
        localParticipant: action.payload,
      };

    case AUCTION_ACTIONS.RESET_AUCTION:
      return initialState;

    default:
      return state;
  }
}

/**
 * AuctionProvider component
 */
export function AuctionProvider({ children }) {
  const [state, dispatch] = useReducer(auctionReducer, initialState);

  // Action creators for convenience
  const setAuctionId = useCallback((auctionId) => {
    dispatch({ type: AUCTION_ACTIONS.SET_AUCTION_ID, payload: auctionId });
  }, []);

  const setAuctionStatus = useCallback((status) => {
    dispatch({ type: AUCTION_ACTIONS.SET_AUCTION_STATUS, payload: status });
  }, []);

  const setHighestBid = useCallback((amount, bidderId, bidderName) => {
    dispatch({
      type: AUCTION_ACTIONS.SET_HIGHEST_BID,
      payload: { amount, bidderId, bidderName },
    });
  }, []);

  const addBid = useCallback((bid) => {
    dispatch({ type: AUCTION_ACTIONS.ADD_BID, payload: bid });
  }, []);

  const setRemainingSeconds = useCallback((seconds) => {
    dispatch({ type: AUCTION_ACTIONS.SET_REMAINING_SECONDS, payload: seconds });
  }, []);

  const addParticipant = useCallback((participant) => {
    dispatch({ type: AUCTION_ACTIONS.ADD_PARTICIPANT, payload: participant });
  }, []);

  const removeParticipant = useCallback((userId) => {
    dispatch({ type: AUCTION_ACTIONS.REMOVE_PARTICIPANT, payload: userId });
  }, []);

  const setActiveSpeaker = useCallback((userId) => {
    dispatch({ type: AUCTION_ACTIONS.SET_ACTIVE_SPEAKER, payload: userId });
  }, []);

  const setConnectionQuality = useCallback((userId, quality) => {
    dispatch({
      type: AUCTION_ACTIONS.SET_CONNECTION_QUALITY,
      payload: { userId, quality },
    });
  }, []);

  const addError = useCallback((error) => {
    dispatch({ type: AUCTION_ACTIONS.ADD_ERROR, payload: error });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: AUCTION_ACTIONS.CLEAR_ERRORS });
  }, []);

  const setLocalParticipant = useCallback((participant) => {
    dispatch({ type: AUCTION_ACTIONS.SET_LOCAL_PARTICIPANT, payload: participant });
  }, []);

  const resetAuction = useCallback(() => {
    dispatch({ type: AUCTION_ACTIONS.RESET_AUCTION });
  }, []);

  const value = {
    state,
    setAuctionId,
    setAuctionStatus,
    setHighestBid,
    addBid,
    setRemainingSeconds,
    addParticipant,
    removeParticipant,
    setActiveSpeaker,
    setConnectionQuality,
    addError,
    clearErrors,
    setLocalParticipant,
    resetAuction,
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
}

/**
 * Custom hook to use AuctionContext
 */
export function useAuction() {
  const context = React.useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within AuctionProvider');
  }
  return context;
}
