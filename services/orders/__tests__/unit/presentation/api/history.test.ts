import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies before import
const mockStatusHistoryRepository = {
  findByOrderItemId: jest.fn(),
  findByOrderId: jest.fn(),
  findRecent: jest.fn(),
  record: jest.fn(),
};

jest.mock('../../../../src/infrastructure/config/dependencies', () => ({
  dependencies: {
    statusHistoryRepository: mockStatusHistoryRepository,
  },
}));

jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

import handler from '../../../../src/presentation/api/history';

describe('History API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('GET /api/history', () => {
    it('should return 405 for non-GET methods', async () => {
      mockReq = { method: 'POST', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Method not allowed'),
        })
      );
    });

    it('should return 400 if no query parameters', async () => {
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('orderId or itemId is required'),
        })
      );
    });

    it('should return history for itemId', async () => {
      const history = [
        {
          id: 'h1',
          orderItemId: 'item-123',
          fromStatus: null,
          toStatus: 'PENDING',
          changedAt: new Date('2025-01-01T10:00:00Z'),
          recipeId: null,
          recipeName: null,
          reason: null,
        },
        {
          id: 'h2',
          orderItemId: 'item-123',
          fromStatus: 'PENDING',
          toStatus: 'ASSIGNED',
          changedAt: new Date('2025-01-01T10:01:00Z'),
          recipeId: 'r1',
          recipeName: 'Pizza',
          reason: null,
        },
      ];

      mockStatusHistoryRepository.findByOrderItemId.mockResolvedValue(history);
      mockReq = { method: 'GET', query: { itemId: 'item-123' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockStatusHistoryRepository.findByOrderItemId).toHaveBeenCalledWith('item-123');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          history: expect.arrayContaining([
            expect.objectContaining({ toStatus: 'PENDING' }),
            expect.objectContaining({ toStatus: 'ASSIGNED' }),
          ]),
          count: 2,
        })
      );
    });

    it('should return history for orderId', async () => {
      const history = [
        {
          id: 'h1',
          orderItemId: 'item-1',
          fromStatus: null,
          toStatus: 'PENDING',
          changedAt: new Date(),
        },
        {
          id: 'h2',
          orderItemId: 'item-2',
          fromStatus: null,
          toStatus: 'PENDING',
          changedAt: new Date(),
        },
      ];

      mockStatusHistoryRepository.findByOrderId.mockResolvedValue(history);
      mockReq = { method: 'GET', query: { orderId: 'order-123' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockStatusHistoryRepository.findByOrderId).toHaveBeenCalledWith('order-123');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
        })
      );
    });

    it('should return empty array for no history', async () => {
      mockStatusHistoryRepository.findByOrderItemId.mockResolvedValue([]);
      mockReq = { method: 'GET', query: { itemId: 'non-existent' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          history: [],
          count: 0,
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockStatusHistoryRepository.findByOrderItemId.mockRejectedValue(new Error('DB error'));
      mockReq = { method: 'GET', query: { itemId: 'item-123' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'DB error',
        })
      );
    });
  });
});
