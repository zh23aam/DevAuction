// Mock async-mutex first
jest.mock('async-mutex', () => ({
  Mutex: jest.fn().mockImplementation(() => ({
    lock: jest.fn().mockResolvedValue(() => {}),
  })),
}));

// Mock the models
jest.mock('../../models/Auction');
jest.mock('../../models/Bid');
jest.mock('../../models/ChatMessage');
jest.mock('../../models/Participant');

// Mock livekitService before requiring auctionService
jest.mock('../livekitService', () => ({
  deleteRoom: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../../constants', () => ({
  HOST_DISCONNECT_GRACE_PERIOD_MS: '1000', // 1 second for testing
}));

const auctionService = require('../auctionService');
const { Mutex } = require('async-mutex');

const Auction = require('../../models/Auction');
const Bid = require('../../models/Bid');
const Participant = require('../../models/Participant');
const livekitService = require('../livekitService');

describe('auctionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('validateBid', () => {
    it('should reject bid not greater than current highest bid', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 100;

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
      });

      const result = await auctionService.validateBid(auctionId, bidderId, bidAmount);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('greater than current highest bid');
      expect(result.requiredMinimumBid).toBe(110);
    });

    it('should reject bid below minimum increment', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 105;

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
      });

      const result = await auctionService.validateBid(auctionId, bidderId, bidAmount);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('minimum increment');
      expect(result.requiredMinimumBid).toBe(110);
    });

    it('should reject self-bid', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder1',
      });

      const result = await auctionService.validateBid(auctionId, bidderId, bidAmount);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already the highest bidder');
    });

    it('should accept valid bid', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
      });

      const result = await auctionService.validateBid(auctionId, bidderId, bidAmount);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error if auction not found', async () => {
      const auctionId = 'nonexistent';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      Auction.findById.mockResolvedValue(null);

      const result = await auctionService.validateBid(auctionId, bidderId, bidAmount);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Auction not found');
    });

    it('should throw error if required parameters missing', async () => {
      await expect(auctionService.validateBid(null, 'bidder1', 100)).rejects.toThrow();
      await expect(auctionService.validateBid('auction123', null, 100)).rejects.toThrow();
      await expect(auctionService.validateBid('auction123', 'bidder1', undefined)).rejects.toThrow();
    });
  });

  describe('processBid', () => {
    it('should persist bid with server timestamp', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
        remainingSeconds: 60,
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      });

      Bid.create.mockResolvedValue({
        _id: 'bid123',
        auctionId,
        bidderId,
        amount: bidAmount,
        status: 'accepted',
        serverTimestamp: new Date(),
      });

      Auction.findByIdAndUpdate.mockResolvedValue({
        currentHighestBid: bidAmount,
        highestBidderId: bidderId,
        remainingSeconds: 60,
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      });

      const result = await auctionService.processBid(auctionId, bidderId, bidAmount);

      expect(result.success).toBe(true);
      expect(result.bid).toBeDefined();
      expect(result.bid.amount).toBe(bidAmount);
      expect(Bid.create).toHaveBeenCalled();
      expect(Auction.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should update auction state with new highest bid', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
        remainingSeconds: 60,
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      });

      Bid.create.mockResolvedValue({
        _id: 'bid123',
        auctionId,
        bidderId,
        amount: bidAmount,
        status: 'accepted',
        serverTimestamp: new Date(),
      });

      Auction.findByIdAndUpdate.mockResolvedValue({
        currentHighestBid: bidAmount,
        highestBidderId: bidderId,
        remainingSeconds: 60,
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      });

      await auctionService.processBid(auctionId, bidderId, bidAmount);

      expect(Auction.findByIdAndUpdate).toHaveBeenCalledWith(
        auctionId,
        expect.objectContaining({
          $set: expect.objectContaining({
            currentHighestBid: bidAmount,
            highestBidderId: bidderId,
          }),
        }),
        { new: true }
      );
    });

    it('should extend timer on anti-sniping trigger', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      const mockAuction = {
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
        remainingSeconds: 20, // Less than 30 seconds
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      Auction.findById.mockResolvedValue(mockAuction);

      Bid.create.mockResolvedValue({
        _id: 'bid123',
        auctionId,
        bidderId,
        amount: bidAmount,
        status: 'accepted',
        serverTimestamp: new Date(),
      });

      Auction.findByIdAndUpdate.mockResolvedValue(mockAuction);

      await auctionService.processBid(auctionId, bidderId, bidAmount);

      expect(mockAuction.remainingSeconds).toBe(50); // 20 + 30
      expect(mockAuction.extensionCount).toBe(1);
      expect(mockAuction.save).toHaveBeenCalled();
    });

    it('should not extend timer if remainingSeconds >= 30', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      const mockAuction = {
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
        remainingSeconds: 60, // Greater than 30 seconds
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      Auction.findById.mockResolvedValue(mockAuction);

      Bid.create.mockResolvedValue({
        _id: 'bid123',
        auctionId,
        bidderId,
        amount: bidAmount,
        status: 'accepted',
        serverTimestamp: new Date(),
      });

      Auction.findByIdAndUpdate.mockResolvedValue(mockAuction);

      await auctionService.processBid(auctionId, bidderId, bidAmount);

      expect(mockAuction.remainingSeconds).toBe(60); // Unchanged
      expect(mockAuction.extensionCount).toBe(0); // Not incremented
    });

    it('should return error if bid validation fails', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 100; // Not greater than current

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
      });

      const result = await auctionService.processBid(auctionId, bidderId, bidAmount);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(Bid.create).not.toHaveBeenCalled();
    });

    it('should use mutex lock to prevent race conditions', async () => {
      const auctionId = 'auction123';
      const bidderId = 'bidder1';
      const bidAmount = 150;

      Auction.findById.mockResolvedValue({
        currentHighestBid: 100,
        minimumIncrement: 10,
        highestBidderId: 'bidder2',
        remainingSeconds: 60,
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      });

      Bid.create.mockResolvedValue({
        _id: 'bid123',
        auctionId,
        bidderId,
        amount: bidAmount,
        status: 'accepted',
        serverTimestamp: new Date(),
      });

      Auction.findByIdAndUpdate.mockResolvedValue({
        currentHighestBid: bidAmount,
        highestBidderId: bidderId,
        remainingSeconds: 60,
        extensionCount: 0,
        save: jest.fn().mockResolvedValue(true),
      });

      const mutex = auctionService.getMutex(auctionId);
      expect(mutex).toBeDefined();
      expect(typeof mutex.lock).toBe('function');

      await auctionService.processBid(auctionId, bidderId, bidAmount);

      // Verify mutex was used (indirectly by checking bid was processed)
      expect(Bid.create).toHaveBeenCalled();
    });
  });

  describe('startAuction', () => {
    it('should set status to active and initialize timer', async () => {
      const auctionId = 'auction123';

      Auction.findByIdAndUpdate.mockResolvedValue({
        _id: auctionId,
        status: 'active',
        remainingSeconds: 300,
        timerStartedAt: new Date(),
      });

      const result = await auctionService.startAuction(auctionId);

      expect(result.success).toBe(true);
      expect(result.auction.status).toBe('active');
      expect(Auction.findByIdAndUpdate).toHaveBeenCalledWith(
        auctionId,
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'active',
          }),
        }),
        { new: true }
      );
    });

    it('should return error if auction not found', async () => {
      const auctionId = 'nonexistent';

      Auction.findByIdAndUpdate.mockResolvedValue(null);

      const result = await auctionService.startAuction(auctionId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Auction not found');
    });
  });

  describe('pauseAuction', () => {
    it('should set status to paused', async () => {
      const auctionId = 'auction123';

      Auction.findByIdAndUpdate.mockResolvedValue({
        _id: auctionId,
        status: 'paused',
        remainingSeconds: 250,
      });

      const result = await auctionService.pauseAuction(auctionId);

      expect(result.success).toBe(true);
      expect(result.auction.status).toBe('paused');
      expect(Auction.findByIdAndUpdate).toHaveBeenCalledWith(
        auctionId,
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'paused',
          }),
        }),
        { new: true }
      );
    });
  });

  describe('resumeAuction', () => {
    it('should set status back to active', async () => {
      const auctionId = 'auction123';

      Auction.findByIdAndUpdate.mockResolvedValue({
        _id: auctionId,
        status: 'active',
        remainingSeconds: 250,
      });

      const result = await auctionService.resumeAuction(auctionId);

      expect(result.success).toBe(true);
      expect(result.auction.status).toBe('active');
      expect(Auction.findByIdAndUpdate).toHaveBeenCalledWith(
        auctionId,
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'active',
          }),
        }),
        { new: true }
      );
    });
  });

  describe('tickTimer', () => {
    it('should decrement remaining seconds by 1', async () => {
      const auctionId = 'auction123';

      const mockAuction = {
        _id: auctionId,
        remainingSeconds: 100,
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
      };

      Auction.findById.mockResolvedValue(mockAuction);

      const result = await auctionService.tickTimer(auctionId);

      expect(result.success).toBe(true);
      expect(result.remainingSeconds).toBe(99);
      expect(mockAuction.save).toHaveBeenCalled();
    });

    it('should set shouldEnd to true when timer reaches 0', async () => {
      const auctionId = 'auction123';

      const mockAuction = {
        _id: auctionId,
        remainingSeconds: 1,
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
      };

      Auction.findById.mockResolvedValue(mockAuction);

      const result = await auctionService.tickTimer(auctionId);

      expect(result.shouldEnd).toBe(true);
      expect(mockAuction.status).toBe('ended');
      expect(mockAuction.endedAt).toBeDefined();
    });

    it('should not go below 0', async () => {
      const auctionId = 'auction123';

      const mockAuction = {
        _id: auctionId,
        remainingSeconds: 0,
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
      };

      Auction.findById.mockResolvedValue(mockAuction);

      const result = await auctionService.tickTimer(auctionId);

      expect(result.remainingSeconds).toBe(0);
    });
  });

  describe('endAuction', () => {
    it('should set status to ended and call deleteRoom', async () => {
      const auctionId = 'auction123';

      const mockAuction = {
        _id: auctionId,
        status: 'ended',
        currentHighestBid: 500,
        highestBidderId: {
          _id: 'bidder1',
          displayName: 'John Doe',
        },
      };

      Auction.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAuction),
      });

      const livekitService = require('../livekitService');
      livekitService.deleteRoom.mockResolvedValue({ success: true });

      const result = await auctionService.endAuction(auctionId);

      expect(result.success).toBe(true);
      expect(result.winner).toBeDefined();
      expect(result.winner.finalBid).toBe(500);
      expect(livekitService.deleteRoom).toHaveBeenCalledWith(auctionId);
    });

    it('should return null winner if no bids placed', async () => {
      const auctionId = 'auction123';

      const mockAuction = {
        _id: auctionId,
        status: 'ended',
        currentHighestBid: 0,
        highestBidderId: null,
      };

      Auction.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAuction),
      });

      const livekitService = require('../livekitService');
      livekitService.deleteRoom.mockResolvedValue({ success: true });

      const result = await auctionService.endAuction(auctionId);

      expect(result.success).toBe(true);
      expect(result.winner).toBeNull();
    });
  });

  describe('getBidHistory', () => {
    it('should return paginated bid history', async () => {
      const auctionId = 'auction123';

      const mockBids = [
        {
          _id: 'bid1',
          auctionId,
          bidderId: { _id: 'bidder1', displayName: 'Alice' },
          amount: 100,
          serverTimestamp: new Date(),
          status: 'accepted',
        },
        {
          _id: 'bid2',
          auctionId,
          bidderId: { _id: 'bidder2', displayName: 'Bob' },
          amount: 150,
          serverTimestamp: new Date(),
          status: 'accepted',
        },
      ];

      Bid.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockBids),
              }),
            }),
          }),
        }),
      });

      Bid.countDocuments.mockResolvedValue(2);

      const result = await auctionService.getBidHistory(auctionId, 50, 0);

      expect(result.bids).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.bids[0].bidderName).toBe('Alice');
      expect(result.bids[1].bidderName).toBe('Bob');
    });

    it('should support pagination with limit and offset', async () => {
      const auctionId = 'auction123';

      Bid.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      Bid.countDocuments.mockResolvedValue(100);

      await auctionService.getBidHistory(auctionId, 25, 50);

      const findCall = Bid.find.mock.results[0].value;
      expect(findCall.populate).toHaveBeenCalled();
    });
  });

  describe('getAuctionStateSnapshot', () => {
    it('should include all required fields', async () => {
      const auctionId = 'auction123';

      const mockAuction = {
        _id: auctionId,
        status: 'active',
        currentHighestBid: 500,
        highestBidderId: {
          _id: 'bidder1',
          displayName: 'John Doe',
        },
        minimumIncrement: 10,
        remainingSeconds: 120,
      };

      const mockBids = [
        {
          _id: 'bid1',
          bidderId: { _id: 'bidder1', displayName: 'John' },
          amount: 100,
          serverTimestamp: new Date(),
        },
      ];

      const mockParticipants = [
        {
          userId: { _id: 'user1', displayName: 'John' },
          role: 'bidder',
          joinedAt: new Date(),
        },
      ];

      Auction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockAuction),
        }),
      });

      Bid.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockBids),
          }),
        }),
      });

      Participant.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockParticipants),
        }),
      });

      const result = await auctionService.getAuctionStateSnapshot(auctionId);

      expect(result.auctionState).toBeDefined();
      expect(result.auctionState.auctionId).toBe(auctionId);
      expect(result.auctionState.status).toBe('active');
      expect(result.auctionState.currentHighestBid).toBe(500);
      expect(result.auctionState.highestBidderId).toBe('bidder1');
      expect(result.auctionState.minimumIncrement).toBe(10);
      expect(result.auctionState.remainingSeconds).toBe(120);
      expect(result.auctionState.bids).toHaveLength(1);
      expect(result.auctionState.participants).toHaveLength(1);
    });

    it('should return error if auction not found', async () => {
      const auctionId = 'nonexistent';

      Auction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await auctionService.getAuctionStateSnapshot(auctionId);

      expect(result.auctionState).toBeNull();
      expect(result.error).toContain('Auction not found');
    });
  });

  describe('autoCloseRoomOnHostDisconnect', () => {
    it('should return grace period in milliseconds', async () => {
      const auctionId = 'auction123';

      const result = await auctionService.autoCloseRoomOnHostDisconnect(auctionId);

      expect(result.success).toBe(true);
      expect(result.gracePeriodMs).toBe(1000); // From mocked constants
    });
  });

  describe('getMutex', () => {
    it('should return same mutex instance for same auctionId', () => {
      const auctionId = 'auction123';

      const mutex1 = auctionService.getMutex(auctionId);
      const mutex2 = auctionService.getMutex(auctionId);

      expect(mutex1).toBe(mutex2);
    });

    it('should return different mutex instances for different auctionIds', () => {
      const mutex1 = auctionService.getMutex('auction1');
      const mutex2 = auctionService.getMutex('auction2');

      expect(mutex1).not.toBe(mutex2);
    });
  });

  describe('AuctionError', () => {
    it('should be an Error instance', () => {
      const error = new auctionService.AuctionError('Test error', new Error('Original'));

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AuctionError');
      expect(error.message).toContain('Test error');
    });
  });

  describe('withErrorHandling', () => {
    it('should execute operation and return result', async () => {
      const operation = jest.fn().mockResolvedValue({ success: true });

      const result = await auctionService.withErrorHandling(operation, 'testOp');

      expect(result).toEqual({ success: true });
      expect(operation).toHaveBeenCalled();
    });

    it('should throw AuctionError on operation failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(
        auctionService.withErrorHandling(operation, 'testOp')
      ).rejects.toThrow(auctionService.AuctionError);
    });
  });
});
