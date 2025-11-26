import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock the entire module chain before importing
jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaPurchaseRepository', () => ({
  PrismaPurchaseRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([]),
    findRecent: jest.fn().mockResolvedValue([]),
    findPaginated: jest.fn().mockResolvedValue({ purchases: [], total: 0 }),
    getStats: jest.fn().mockResolvedValue({ total: 0, successful: 0, failed: 0 }),
  })),
}));

jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../../src/infrastructure/http/cors', () => ({
  withCors: (handler: any) => handler,
}));

// Import after mocking
import handler from '../../../../src/presentation/api/purchases';

describe('Purchases API', () => {
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

  describe('GET /api/purchases', () => {
    it('should return purchase history', async () => {
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should accept limit query parameter', async () => {
      mockReq = { method: 'GET', query: { limit: '50' } };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for POST', async () => {
      mockReq = { method: 'POST' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Method not allowed',
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
