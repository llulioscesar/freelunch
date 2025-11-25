import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies before import
const mockListPlatesUseCase = {
  execute: jest.fn(),
};

jest.mock('../../../../src/infrastructure/config/dependencies', () => ({
  dependencies: {
    listPlatesUseCase: mockListPlatesUseCase,
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

jest.mock('../../../../src/infrastructure/metrics/MetricsMiddleware', () => ({
  withMetrics: (handler: any) => handler,
}));

import handler from '../../../../src/presentation/api/plates';

describe('Plates API', () => {
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

  describe('GET /api/plates', () => {
    it('should return 405 for non-GET methods', async () => {
      mockReq = { method: 'POST', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should return plates list successfully', async () => {
      const plates = [
        {
          id: 'plate-1',
          orderId: 'order-1',
          orderItemId: 'item-1',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'plate-2',
          orderId: 'order-1',
          orderItemId: 'item-2',
          status: 'COOKING',
          recipeId: 'recipe-1',
          recipeName: 'Pizza',
          createdAt: new Date().toISOString(),
        },
      ];

      mockListPlatesUseCase.execute.mockResolvedValue({ plates });
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockListPlatesUseCase.execute).toHaveBeenCalledWith({
        status: undefined,
        orderId: undefined,
      });
      expect(jsonMock).toHaveBeenCalledWith({ plates });
    });

    it('should filter plates by status', async () => {
      const plates = [
        {
          id: 'plate-1',
          status: 'COOKING',
        },
      ];

      mockListPlatesUseCase.execute.mockResolvedValue({ plates });
      mockReq = { method: 'GET', query: { status: 'COOKING' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockListPlatesUseCase.execute).toHaveBeenCalledWith({
        status: 'COOKING',
        orderId: undefined,
      });
    });

    it('should filter plates by orderId', async () => {
      const plates = [
        {
          id: 'plate-1',
          orderId: 'order-123',
          status: 'PENDING',
        },
      ];

      mockListPlatesUseCase.execute.mockResolvedValue({ plates });
      mockReq = { method: 'GET', query: { orderId: 'order-123' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockListPlatesUseCase.execute).toHaveBeenCalledWith({
        status: undefined,
        orderId: 'order-123',
      });
    });

    it('should return 400 for invalid status', async () => {
      mockReq = { method: 'GET', query: { status: 'INVALID_STATUS' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid request',
        })
      );
    });

    it('should handle use case errors', async () => {
      mockListPlatesUseCase.execute.mockRejectedValue(new Error('Database error'));
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Database error' });
    });

    it('should handle unknown errors', async () => {
      mockListPlatesUseCase.execute.mockRejectedValue('Unknown error');
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to fetch plates',
      });
    });
  });
});
