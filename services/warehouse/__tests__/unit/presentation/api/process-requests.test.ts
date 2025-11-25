import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock the entire module chain before importing
jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaInventoryRepository', () => ({
  PrismaInventoryRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
    findByName: jest.fn().mockResolvedValue(null),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaPurchaseRepository', () => ({
  PrismaPurchaseRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/http/HttpMarketClient', () => ({
  HttpMarketClient: jest.fn().mockImplementation(() => ({
    buyIngredient: jest.fn().mockResolvedValue({ quantityBought: 5 }),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/messaging/RedisKitchenClient', () => ({
  RedisKitchenClient: jest.fn().mockImplementation(() => ({
    notifyIngredientsReserved: jest.fn().mockResolvedValue(undefined),
    notifyIngredientsUnavailable: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/cache/RedisClient', () => ({
  RedisClient: {
    getInstance: jest.fn().mockReturnValue({
      xgroup: jest.fn().mockResolvedValue('OK'),
      xreadgroup: jest.fn().mockResolvedValue(null),
      xack: jest.fn().mockResolvedValue(1),
    }),
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

// Import after mocking
import handler from '../../../../src/presentation/api/process-requests';

describe('Process Requests API', () => {
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

  describe('POST /api/process-requests', () => {
    it('should process ingredient requests', async () => {
      mockReq = { method: 'POST', body: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          processedCount: expect.any(Number),
        })
      );
    });

    it('should accept maxMessages in body', async () => {
      mockReq = { method: 'POST', body: { maxMessages: 5 } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should include duration in response', async () => {
      mockReq = { method: 'POST', body: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for GET', async () => {
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Method not allowed'),
        })
      );
    });

    it('should return 405 for PUT', async () => {
      mockReq = { method: 'PUT' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
    });

    it('should return 405 for DELETE', async () => {
      mockReq = { method: 'DELETE' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
    });
  });
});
