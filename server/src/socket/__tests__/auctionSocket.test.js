// Mock dependencies FIRST before requiring modules
jest.mock('../../utils/auth0Verify', () => ({
  verifyAuth0Token: jest.fn((token, callback) => {
    if (token === 'invalid-token') {
      return callback(new Error('Invalid token'));
    }
    if (token.includes('expired')) {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      return callback(error);
    }
    // Auth0 tokens have userId at decoded.sub
    return callback(null, { sub: 'user-123', role: 'bidder', auctionId: 'auction-123' });
  }),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../services/auctionService', () => ({
  processBid: jest.fn(),
  startAuction: jest.fn(),
  pauseAuction: jest.fn(),
  resumeAuction: jest.fn(),
  endAuction: jest.fn(),
  tickTimer: jest.fn(),
  getAuctionStateSnapshot: jest.fn(),
  getModels: jest.fn(() => ({
    ChatMessage: {
      create: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  })),
}));

jest.mock('../../../constants', () => ({
  AUTH0_DOMAIN: 'test-tenant.auth0.com',
  AUTH0_AUDIENCE: 'test-api-identifier',
}));

const { setupAuctionSocket } = require('../auctionSocket');

describe('auctionSocket - Auth0 JWT Authentication Middleware', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let middlewareChain;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Socket.io instance
    middlewareChain = [];
    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn((middleware) => {
            middlewareChain.push(middleware);
          }),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    // Create mock socket
    mockSocket = {
      id: 'socket-123',
      handshake: {
        auth: {
          token: null,
          displayName: 'Test User',
        },
      },
      userId: null,
      role: null,
      auctionId: null,
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
  });

  test('Auth0 middleware accepts valid token', (done) => {
    mockSocket.handshake.auth.token = 'valid-token';

    const next = jest.fn();
    middlewareChain[0](mockSocket, next);

    // Give callback time to execute
    setTimeout(() => {
      expect(mockSocket.userId).toBe('user-123');
      expect(mockSocket.role).toBe('bidder');
      expect(mockSocket.auctionId).toBe('auction-123');
      expect(next).toHaveBeenCalledWith();
      done();
    }, 50);
  });

  test('Auth0 middleware rejects token without token provided', (done) => {
    mockSocket.handshake.auth.token = null;

    const next = jest.fn();
    middlewareChain[0](mockSocket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('No token provided');
    done();
  });

  test('Auth0 middleware rejects invalid token', (done) => {
    mockSocket.handshake.auth.token = 'invalid-token';

    const next = jest.fn();
    middlewareChain[0](mockSocket, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Authentication error');
      done();
    }, 50);
  });

  test('Auth0 middleware rejects expired token', (done) => {
    mockSocket.handshake.auth.token = 'expired-token';

    const next = jest.fn();
    middlewareChain[0](mockSocket, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      done();
    }, 50);
  });
});

describe('auctionSocket - bid:submit Event Handler', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'user-123',
      role: 'bidder',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Test Bidder',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);

    // Extract connection handler
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('bid:submit calls processBid and emits bid:accepted on success', async () => {
    auctionService.processBid.mockResolvedValue({
      success: true,
      bid: {
        id: 'bid-123',
        auctionId: 'auction-123',
        bidderId: 'user-123',
        amount: 1000,
        serverTimestamp: new Date(),
      },
    });

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    const bidSubmitHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'bid:submit') {
        bidSubmitHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);

    // Simulate bid:submit event
    await bidSubmitHandler({ bidAmount: 1000 });

    expect(auctionService.processBid).toHaveBeenCalledWith(
      'auction-123',
      'user-123',
      1000
    );
    expect(auctionNamespace.emit).toHaveBeenCalledWith(
      'bid:accepted',
      expect.objectContaining({
        bid: expect.objectContaining({
          amount: 1000,
        }),
        bidderName: 'Test Bidder',
      })
    );
  });

  test('bid:submit emits bid:rejected on validation failure', async () => {
    auctionService.processBid.mockResolvedValue({
      success: false,
      error: 'Bid not greater than current highest',
      requiredMinimumBid: 1500,
    });

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    const bidSubmitHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'bid:submit') {
        bidSubmitHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);

    await bidSubmitHandler({ bidAmount: 900 });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'bid:rejected',
      expect.objectContaining({
        reason: 'Bid not greater than current highest',
        requiredMinimumBid: 1500,
      })
    );
  });

  test('bid:submit handles processBid errors gracefully', async () => {
    auctionService.processBid.mockRejectedValue(
      new Error('Database error')
    );

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    const bidSubmitHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'bid:submit') {
        bidSubmitHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);

    await bidSubmitHandler({ bidAmount: 1000 });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'bid:rejected',
      expect.objectContaining({
        reason: 'Internal server error',
      })
    );
  });
});


describe('auctionSocket - auction:start Event Handler', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'host-123',
      role: 'host',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Test Host',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('auction:start calls startAuction and broadcasts auction:started', async () => {
    auctionService.startAuction.mockResolvedValue({
      success: true,
      auction: {
        status: 'active',
        remainingSeconds: 300,
      },
    });

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'pending' },
    });

    const auctionStartHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'auction:start') {
        auctionStartHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);
    await auctionStartHandler();

    expect(auctionService.startAuction).toHaveBeenCalledWith('auction-123');
    expect(auctionNamespace.emit).toHaveBeenCalledWith(
      'auction:started',
      expect.objectContaining({
        auctionId: 'auction-123',
        status: 'active',
        remainingSeconds: 300,
      })
    );
  });

  test('auction:start rejects non-host users', async () => {
    mockSocket.role = 'bidder';

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'pending' },
    });

    const auctionStartHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'auction:start') {
        auctionStartHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);
    await auctionStartHandler();

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Only host can start auction',
      })
    );
    expect(auctionService.startAuction).not.toHaveBeenCalled();
  });
});

describe('auctionSocket - auction:pause, auction:resume, auction:end Events', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'host-123',
      role: 'host',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Test Host',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('auction:pause calls pauseAuction and broadcasts auction:paused', async () => {
    auctionService.pauseAuction.mockResolvedValue({
      success: true,
      auction: {
        status: 'paused',
        remainingSeconds: 150,
      },
    });

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    const auctionPauseHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'auction:pause') {
        auctionPauseHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);
    await auctionPauseHandler();

    expect(auctionService.pauseAuction).toHaveBeenCalledWith('auction-123');
    expect(auctionNamespace.emit).toHaveBeenCalledWith(
      'auction:paused',
      expect.objectContaining({
        status: 'paused',
      })
    );
  });

  test('auction:resume calls resumeAuction and broadcasts auction:resumed', async () => {
    auctionService.resumeAuction.mockResolvedValue({
      success: true,
      auction: {
        status: 'active',
        remainingSeconds: 150,
      },
    });

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'paused' },
    });

    const auctionResumeHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'auction:resume') {
        auctionResumeHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);
    await auctionResumeHandler();

    expect(auctionService.resumeAuction).toHaveBeenCalledWith('auction-123');
    expect(auctionNamespace.emit).toHaveBeenCalledWith(
      'auction:resumed',
      expect.objectContaining({
        status: 'active',
      })
    );
  });

  test('auction:end calls endAuction and broadcasts auction:ended with winner', async () => {
    auctionService.endAuction.mockResolvedValue({
      success: true,
      winner: {
        displayName: 'Winner User',
        finalBid: 5000,
      },
    });

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    const auctionEndHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'auction:end') {
        auctionEndHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);
    await auctionEndHandler();

    expect(auctionService.endAuction).toHaveBeenCalledWith('auction-123');
    expect(auctionNamespace.emit).toHaveBeenCalledWith(
      'auction:ended',
      expect.objectContaining({
        winner: expect.objectContaining({
          displayName: 'Winner User',
          finalBid: 5000,
        }),
      })
    );
  });
});

describe('auctionSocket - chat:message Event Handler', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;
  let ChatMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');
    ChatMessage = auctionService.getModels().ChatMessage;

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'user-123',
      role: 'bidder',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Test User',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('chat:message event handler is registered on connection', () => {
    connectionHandler(mockSocket);

    // Verify that socket.on was called with 'chat:message'
    const chatMessageRegistered = mockSocket.on.mock.calls.some(
      call => call[0] === 'chat:message'
    );

    expect(chatMessageRegistered).toBe(true);
  });

  test('chat:message rejects empty messages', async () => {
    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    let chatMessageHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'chat:message') {
        chatMessageHandler = handler;
      }
    });

    connectionHandler(mockSocket);

    if (chatMessageHandler) {
      await chatMessageHandler({ messageText: '   ' });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          message: 'Message cannot be empty',
        })
      );
      expect(ChatMessage.create).not.toHaveBeenCalled();
    }
  });
});

describe('auctionSocket - chat:delete Event Handler', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;
  let ChatMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');
    ChatMessage = auctionService.getModels().ChatMessage;

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'host-123',
      role: 'host',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Test Host',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('chat:delete event handler is registered on connection', () => {
    connectionHandler(mockSocket);

    // Verify that socket.on was called with 'chat:delete'
    const chatDeleteRegistered = mockSocket.on.mock.calls.some(
      call => call[0] === 'chat:delete'
    );

    expect(chatDeleteRegistered).toBe(true);
  });

  test('chat:delete rejects non-host users', async () => {
    mockSocket.role = 'bidder';

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    let chatDeleteHandler;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'chat:delete') {
        chatDeleteHandler = handler;
      }
    });

    connectionHandler(mockSocket);

    if (chatDeleteHandler) {
      await chatDeleteHandler({ messageId: 'msg-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          message: 'Only host can delete messages',
        })
      );
      expect(ChatMessage.findByIdAndUpdate).not.toHaveBeenCalled();
    }
  });
});

describe('auctionSocket - chat:reaction Event Handler', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'user-123',
      role: 'bidder',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Test User',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('chat:reaction broadcasts but does not persist', async () => {
    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    const chatReactionHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'chat:reaction') {
        chatReactionHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);
    await chatReactionHandler({ emoji: '👍' });

    expect(auctionNamespace.emit).toHaveBeenCalledWith(
      'chat:reactionReceived',
      expect.objectContaining({
        emoji: '👍',
        auctionId: 'auction-123',
        userId: 'user-123',
        senderName: 'Test User',
      })
    );

    // Verify ChatMessage.create was NOT called (reaction not persisted)
    const ChatMessage = auctionService.getModels().ChatMessage;
    expect(ChatMessage.create).not.toHaveBeenCalled();
  });

  test('chat:reaction rejects missing emoji', async () => {
    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    const chatReactionHandler = jest.fn();
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'chat:reaction') {
        chatReactionHandler.mockImplementation(handler);
      }
    });

    connectionHandler(mockSocket);
    await chatReactionHandler({ emoji: null });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Emoji is required',
      })
    );
  });
});

describe('auctionSocket - Late Joiner State Snapshot', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;
  let ChatMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');
    ChatMessage = auctionService.getModels().ChatMessage;

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'user-456',
      role: 'bidder',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Late Joiner',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('late joiner receives state snapshot immediately upon connection', async () => {
    const mockState = {
      auctionId: 'auction-123',
      status: 'active',
      currentHighestBid: 5000,
      highestBidderId: 'user-123',
      minimumIncrement: 100,
      remainingSeconds: 120,
      bids: [],
      participants: [],
    };

    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: mockState,
    });

    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    connectionHandler(mockSocket);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'auction:stateSnapshot',
      mockState
    );
  });

  test('getAuctionStateSnapshot is called on connection', async () => {
    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    connectionHandler(mockSocket);

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(auctionService.getAuctionStateSnapshot).toHaveBeenCalledWith('auction-123');
  });
});

describe('auctionSocket - System Messages Auto-Insertion', () => {
  let io;
  let auctionNamespace;
  let mockSocket;
  let connectionHandler;
  let auctionService;
  let ChatMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    auctionService = require('../../services/auctionService');
    ChatMessage = auctionService.getModels().ChatMessage;

    io = {
      of: jest.fn(() => {
        auctionNamespace = {
          use: jest.fn(),
          on: jest.fn(),
          emit: jest.fn(),
          startTimer: null,
          stopTimer: null,
        };
        return auctionNamespace;
      }),
    };

    mockSocket = {
      id: 'socket-123',
      userId: 'user-123',
      role: 'bidder',
      auctionId: 'auction-123',
      handshake: {
        auth: {
          displayName: 'Test User',
        },
      },
      emit: jest.fn(),
      on: jest.fn(),
    };

    setupAuctionSocket(io);
    connectionHandler = auctionNamespace.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });

  test('disconnect event handler is registered on connection', () => {
    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    connectionHandler(mockSocket);

    // Verify that socket.on was called with 'disconnect'
    const disconnectRegistered = mockSocket.on.mock.calls.some(
      call => call[0] === 'disconnect'
    );

    expect(disconnectRegistered).toBe(true);
  });

  test('error event handler is registered on connection', () => {
    auctionService.getAuctionStateSnapshot.mockResolvedValue({
      auctionState: { status: 'active' },
    });

    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    connectionHandler(mockSocket);

    // Verify that socket.on was called with 'error'
    const errorRegistered = mockSocket.on.mock.calls.some(
      call => call[0] === 'error'
    );

    expect(errorRegistered).toBe(true);
  });
});
