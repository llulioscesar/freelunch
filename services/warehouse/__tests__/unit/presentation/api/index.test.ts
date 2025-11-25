import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock the entire module chain before importing
jest.mock('../../../../src/application/services/HealthCheckService', () => ({
  HealthCheckService: jest.fn().mockImplementation(() => ({
    performHealthCheck: jest.fn().mockResolvedValue({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: 1000,
      checks: {
        database: { status: 'up', latency: 10 },
        redis: { status: 'up', latency: 5 },
      },
    }),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/health/SystemHealthChecker', () => ({
  SystemHealthChecker: jest.fn().mockImplementation(() => ({
    checkAll: jest.fn().mockResolvedValue({
      database: { status: 'up', latency: 10 },
      redis: { status: 'up', latency: 5 },
    }),
  })),
}));

// Import after mocking
import handler from '../../../../src/presentation/api/index';

describe('Health Check API (index)', () => {
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

  describe('GET /api', () => {
    it('should return health status', async () => {
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'warehouse-service',
          status: 'healthy',
        })
      );
    });

    it('should include architecture info', async () => {
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          architecture: 'hexagonal-ddd',
        })
      );
    });

    it('should include endpoints list', async () => {
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoints: expect.any(Array),
        })
      );
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for POST', async () => {
      mockReq = { method: 'POST' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Method not allowed',
        })
      );
    });

    it('should return 405 for PUT', async () => {
      mockReq = { method: 'PUT' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
    });
  });
});
