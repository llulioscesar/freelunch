/**
 * Unit Tests: Order Status API Endpoint (with mocks)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies
jest.mock('../../../../src/infrastructure/config/dependencies', () => ({
  dependencies: {
    getOrderStatusUseCase: {
      execute: jest.fn(),
    },
    updateOrderStatusUseCase: {
      execute: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/infrastructure/metrics/MetricsMiddleware', () => ({
  withMetrics: (handler: any) => handler,
}));

jest.mock('../../../../src/infrastructure/http/cors', () => ({
  withCors: (handler: any) => handler,
}));

import { dependencies } from '../../../../src/infrastructure/config/dependencies';

// Import handler after mocks
let handler: any;

beforeAll(async () => {
  // Dynamic import after mocks are set
  const module = await import('../../../../src/presentation/api/status');
  handler = module.default;
});

describe('Order Status API (Unit with Mocks)', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('GET', () => {
    it('should get order status successfully', async () => {
      mockReq.method = 'GET';
      mockReq.query = { id: 'ORD-123-ABC' };

      (dependencies.getOrderStatusUseCase.execute as jest.Mock).mockResolvedValue({
        success: true,
        order: {
          id: 'ORD-123-ABC',
          status: 'PENDING',
          quantity: 5,
        },
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.any(Object),
        })
      );
    });

    it('should return 404 when order not found', async () => {
      mockReq.method = 'GET';
      mockReq.query = { id: 'ORD-999-NOTFOUND' };

      (dependencies.getOrderStatusUseCase.execute as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Order not found',
        })
      );
    });
  });

  describe('PATCH', () => {
    it('should update order status successfully', async () => {
      mockReq.method = 'PATCH';
      mockReq.query = { id: 'ORD-123-ABC' };
      mockReq.body = { status: 'PREPARING' };

      (dependencies.updateOrderStatusUseCase.execute as jest.Mock).mockResolvedValue({
        success: true,
        order: {
          id: 'ORD-123-ABC',
          status: 'PREPARING',
        },
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(dependencies.updateOrderStatusUseCase.execute).toHaveBeenCalledWith({
        orderId: 'ORD-123-ABC',
        status: 'PREPARING',
        completedAt: undefined,
      });
    });

    it('should update order status with completedAt', async () => {
      mockReq.method = 'PATCH';
      mockReq.query = { id: 'ORD-123-ABC' };
      mockReq.body = {
        status: 'DELIVERED',
        completedAt: '2023-01-01T00:00:00.000Z',
      };

      (dependencies.updateOrderStatusUseCase.execute as jest.Mock).mockResolvedValue({
        success: true,
        order: {
          id: 'ORD-123-ABC',
          status: 'DELIVERED',
        },
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(dependencies.updateOrderStatusUseCase.execute).toHaveBeenCalledWith({
        orderId: 'ORD-123-ABC',
        status: 'DELIVERED',
        completedAt: '2023-01-01T00:00:00.000Z',
      });
    });

    it('should return 404 when order not found', async () => {
      mockReq.method = 'PATCH';
      mockReq.query = { id: 'ORD-999-NOTFOUND' };
      mockReq.body = { status: 'PREPARING' };

      (dependencies.updateOrderStatusUseCase.execute as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid request body', async () => {
      mockReq.method = 'PATCH';
      mockReq.query = { id: 'ORD-123-ABC' };
      mockReq.body = {}; // Missing status

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid request',
        })
      );
    });
  });

  describe('Common', () => {
    it('should return 400 when orderId is missing', async () => {
      mockReq.method = 'GET';
      mockReq.query = {}; // No id

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Order ID is required',
        })
      );
    });

    it('should return 405 for unsupported methods', async () => {
      mockReq.method = 'POST';
      mockReq.query = { id: 'ORD-123-ABC' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
    });

    it('should handle use case errors', async () => {
      mockReq.method = 'GET';
      mockReq.query = { id: 'ORD-123-ABC' };

      (dependencies.getOrderStatusUseCase.execute as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Database error',
        })
      );
    });

    it('should handle unknown errors', async () => {
      mockReq.method = 'GET';
      mockReq.query = { id: 'ORD-123-ABC' };

      (dependencies.getOrderStatusUseCase.execute as jest.Mock).mockRejectedValue('Unknown error');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
