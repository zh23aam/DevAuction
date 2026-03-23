const request = require('supertest');
const express = require('express');

// Mock the services BEFORE requiring the controller
jest.mock('../services/livekitService', () => ({
  issueToken: jest.fn(),
  deleteRoom: jest.fn(),
  getParticipants: jest.fn(),
}));

jest.mock('../services/auctionService', () => ({
  getBidHistory: jest.fn(),
  getAuctionStateSnapshot: jest.fn(),
}));

const auctionRoomController = require('./auctionRoomController');
const livekitService = require('../services/livekitService');
const auctionService = require('../services/auctionService');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mount the routes
  app.post('/api/auctions/:auctionId/token', auctionRoomController.issueToken);
  app.get('/api/auctions/:auctionId/bids', auctionRoomController.getBidHistory);
  app.get('/api/auctions/:auctionId/state', auctionRoomController.getAuctionState);
  app.post('/api/auctions/:auctionId/room/close', auctionRoomController.closeRoom);

  return app;
};

describe('Auction Room Controller - REST API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/auctions/:auctionId/token', () => {
    it('should return token with expiresAt on successful token issuance', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';
      const mockToken = 'mock-jwt-token-xyz';
      const mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      livekitService.issueToken.mockResolvedValue({
        token: mockToken,
        expiresAt: mockExpiresAt,
      });

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/token`)
        .send({
          userId,
          role: 'bidder',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', mockToken);
      expect(response.body).toHaveProperty('expiresAt');
      expect(livekitService.issueToken).toHaveBeenCalledWith(auctionId, userId, 'bidder');
    });

    it('should return 400 when missing required parameters', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/token`)
        .send({
          userId: '507f1f77bcf86cd799439012',
          // missing role
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should return 404 when auctionId is missing from URL', async () => {
      const response = await request(app)
        .post('/api/auctions//token')
        .send({
          userId: '507f1f77bcf86cd799439012',
          role: 'bidder',
        });

      // Express returns 404 for routes that don't match
      expect(response.status).toBe(404);
    });

    it('should return 500 when livekitService throws error', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      livekitService.issueToken.mockRejectedValue(
        new Error('LiveKit API error')
      );

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/token`)
        .send({
          userId,
          role: 'bidder',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to issue token');
    });

    it('should issue token for host role with publish permissions', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      livekitService.issueToken.mockResolvedValue({
        token: 'host-token',
        expiresAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/token`)
        .send({
          userId,
          role: 'host',
        });

      expect(response.status).toBe(200);
      expect(livekitService.issueToken).toHaveBeenCalledWith(auctionId, userId, 'host');
    });

    it('should issue token for observer role without publish permissions', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      livekitService.issueToken.mockResolvedValue({
        token: 'observer-token',
        expiresAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/token`)
        .send({
          userId,
          role: 'observer',
        });

      expect(response.status).toBe(200);
      expect(livekitService.issueToken).toHaveBeenCalledWith(auctionId, userId, 'observer');
    });
  });

  describe('GET /api/auctions/:auctionId/bids', () => {
    it('should return paginated bid history with default limit and offset', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const mockBids = [
        {
          id: 'bid1',
          bidderId: 'user1',
          bidderName: 'Alice',
          amount: 100,
          status: 'accepted',
          serverTimestamp: new Date(),
        },
        {
          id: 'bid2',
          bidderId: 'user2',
          bidderName: 'Bob',
          amount: 150,
          status: 'accepted',
          serverTimestamp: new Date(),
        },
      ];

      auctionService.getBidHistory.mockResolvedValue({
        bids: mockBids,
        total: 2,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bids');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body.bids).toHaveLength(2);
      expect(auctionService.getBidHistory).toHaveBeenCalledWith(auctionId, 50, 0);
    });

    it('should support custom limit and offset query parameters', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const mockBids = [
        {
          id: 'bid3',
          bidderId: 'user3',
          bidderName: 'Charlie',
          amount: 200,
          status: 'accepted',
          serverTimestamp: new Date(),
        },
      ];

      auctionService.getBidHistory.mockResolvedValue({
        bids: mockBids,
        total: 10,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`)
        .query({ limit: 25, offset: 5 });

      expect(response.status).toBe(200);
      expect(response.body.bids).toHaveLength(1);
      expect(response.body.total).toBe(10);
      expect(auctionService.getBidHistory).toHaveBeenCalledWith(auctionId, 25, 5);
    });

    it('should return empty bids array when no bids exist', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      auctionService.getBidHistory.mockResolvedValue({
        bids: [],
        total: 0,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`);

      expect(response.status).toBe(200);
      expect(response.body.bids).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return 404 when auctionId is missing from URL', async () => {
      const response = await request(app)
        .get('/api/auctions//bids');

      // Express returns 404 for routes that don't match
      expect(response.status).toBe(404);
    });

    it('should return 500 when auctionService throws error', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      auctionService.getBidHistory.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to retrieve bid history');
    });

    it('should include bidder names in bid history', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const mockBids = [
        {
          id: 'bid1',
          bidderId: 'user1',
          bidderName: 'Alice Johnson',
          amount: 500,
          status: 'accepted',
          serverTimestamp: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      auctionService.getBidHistory.mockResolvedValue({
        bids: mockBids,
        total: 1,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`);

      expect(response.status).toBe(200);
      expect(response.body.bids[0]).toHaveProperty('bidderName', 'Alice Johnson');
      expect(response.body.bids[0]).toHaveProperty('amount', 500);
    });
  });

  describe('GET /api/auctions/:auctionId/state', () => {
    it('should return complete auction state snapshot', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const mockState = {
        auctionId,
        status: 'active',
        currentHighestBid: 500,
        highestBidderId: 'user1',
        highestBidderName: 'Alice',
        minimumIncrement: 50,
        remainingSeconds: 120,
        bids: [
          {
            id: 'bid1',
            bidderId: 'user1',
            bidderName: 'Alice',
            amount: 500,
            status: 'accepted',
            serverTimestamp: new Date(),
          },
        ],
        participants: [
          {
            userId: 'user1',
            displayName: 'Alice',
            role: 'host',
            joinedAt: new Date(),
          },
        ],
      };

      auctionService.getAuctionStateSnapshot.mockResolvedValue({
        auctionState: mockState,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/state`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('auctionId', auctionId);
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('currentHighestBid', 500);
      expect(response.body).toHaveProperty('highestBidderId');
      expect(response.body).toHaveProperty('minimumIncrement');
      expect(response.body).toHaveProperty('remainingSeconds');
      expect(response.body).toHaveProperty('bids');
      expect(response.body).toHaveProperty('participants');
      expect(auctionService.getAuctionStateSnapshot).toHaveBeenCalledWith(auctionId);
    });

    it('should return 404 when auction not found', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      auctionService.getAuctionStateSnapshot.mockResolvedValue({
        auctionState: null,
        error: 'Auction not found',
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/state`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Auction not found');
    });

    it('should return 404 when auctionId is missing from URL', async () => {
      const response = await request(app)
        .get('/api/auctions//state');

      // Express returns 404 for routes that don't match
      expect(response.status).toBe(404);
    });

    it('should return 500 when auctionService throws error', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      auctionService.getAuctionStateSnapshot.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/state`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to retrieve auction state');
    });

    it('should include all required state fields', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const mockState = {
        auctionId,
        status: 'pending',
        currentHighestBid: 0,
        highestBidderId: null,
        highestBidderName: null,
        minimumIncrement: 25,
        remainingSeconds: 300,
        bids: [],
        participants: [],
      };

      auctionService.getAuctionStateSnapshot.mockResolvedValue({
        auctionState: mockState,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/state`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockState);
    });
  });

  describe('POST /api/auctions/:auctionId/room/close', () => {
    it('should close room when user is host', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';
      const mockDeletedAt = new Date();

      livekitService.deleteRoom.mockResolvedValue({
        success: true,
        deletedAt: mockDeletedAt,
      });

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId,
          role: 'host',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('deletedAt');
      expect(livekitService.deleteRoom).toHaveBeenCalledWith(auctionId);
    });

    it('should return 403 when user is not host', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId,
          role: 'bidder',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Only host can close the room');
      expect(livekitService.deleteRoom).not.toHaveBeenCalled();
    });

    it('should return 403 when user is observer', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId,
          role: 'observer',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Only host can close the room');
    });

    it('should return 404 when auctionId is missing from URL', async () => {
      const response = await request(app)
        .post('/api/auctions//room/close')
        .send({
          userId: '507f1f77bcf86cd799439012',
          role: 'host',
        });

      // Express returns 404 for routes that don't match
      expect(response.status).toBe(404);
    });

    it('should return 500 when livekitService throws error', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      livekitService.deleteRoom.mockRejectedValue(
        new Error('LiveKit API error')
      );

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId,
          role: 'host',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to close room');
    });

    it('should enforce host-only authorization', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      // Test with bidder role
      let response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId: 'user1',
          role: 'bidder',
        });

      expect(response.status).toBe(403);

      // Test with observer role
      response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId: 'user2',
          role: 'observer',
        });

      expect(response.status).toBe(403);

      // Test with host role - should succeed
      livekitService.deleteRoom.mockResolvedValue({
        success: true,
        deletedAt: new Date(),
      });

      response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId: 'user3',
          role: 'host',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Integration Tests - Multiple Endpoints', () => {
    it('should handle token issuance followed by state retrieval', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';

      // Issue token
      livekitService.issueToken.mockResolvedValue({
        token: 'test-token',
        expiresAt: new Date(),
      });

      let response = await request(app)
        .post(`/api/auctions/${auctionId}/token`)
        .send({
          userId,
          role: 'bidder',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');

      // Get state
      auctionService.getAuctionStateSnapshot.mockResolvedValue({
        auctionState: {
          auctionId,
          status: 'active',
          currentHighestBid: 100,
          highestBidderId: userId,
          highestBidderName: 'Test User',
          minimumIncrement: 10,
          remainingSeconds: 60,
          bids: [],
          participants: [],
        },
      });

      response = await request(app)
        .get(`/api/auctions/${auctionId}/state`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should handle bid history retrieval and room closure', async () => {
      const auctionId = '507f1f77bcf86cd799439011';
      const hostId = '507f1f77bcf86cd799439012';

      // Get bid history
      auctionService.getBidHistory.mockResolvedValue({
        bids: [
          {
            id: 'bid1',
            bidderId: 'user1',
            bidderName: 'Alice',
            amount: 100,
            status: 'accepted',
            serverTimestamp: new Date(),
          },
        ],
        total: 1,
      });

      let response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`);

      expect(response.status).toBe(200);
      expect(response.body.bids).toHaveLength(1);

      // Close room as host
      livekitService.deleteRoom.mockResolvedValue({
        success: true,
        deletedAt: new Date(),
      });

      response = await request(app)
        .post(`/api/auctions/${auctionId}/room/close`)
        .send({
          userId: hostId,
          role: 'host',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/token`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle very large limit parameter', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      auctionService.getBidHistory.mockResolvedValue({
        bids: [],
        total: 0,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`)
        .query({ limit: 999999 });

      expect(response.status).toBe(200);
      expect(auctionService.getBidHistory).toHaveBeenCalledWith(auctionId, 999999, 0);
    });

    it('should handle negative offset parameter', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      auctionService.getBidHistory.mockResolvedValue({
        bids: [],
        total: 0,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`)
        .query({ offset: -5 });

      expect(response.status).toBe(200);
      expect(auctionService.getBidHistory).toHaveBeenCalledWith(auctionId, 50, -5);
    });

    it('should handle string parameters that should be numbers', async () => {
      const auctionId = '507f1f77bcf86cd799439011';

      auctionService.getBidHistory.mockResolvedValue({
        bids: [],
        total: 0,
      });

      const response = await request(app)
        .get(`/api/auctions/${auctionId}/bids`)
        .query({ limit: 'abc', offset: 'xyz' });

      expect(response.status).toBe(200);
      // parseInt('abc', 10) returns NaN, which should be handled
      expect(auctionService.getBidHistory).toHaveBeenCalled();
    });
  });
});
