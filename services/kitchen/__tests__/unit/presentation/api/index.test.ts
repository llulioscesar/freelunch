import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies before import
const mockPerformHealthCheck = jest.fn();

jest.mock('../../../../src/application/services/HealthCheckService.js', () => ({
  HealthCheckService: jest.fn().mockImplementation(() => ({
    performHealthCheck: mockPerformHealthCheck,
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/health/SystemHealthChecker.js', () => ({
  SystemHealthChecker: jest.fn().mockImplementation(() => ({})),
}));

import handler from '../../../../src/presentation/api/index';

describe('Health Check API', () => {
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

  describe('GET /api/index', () => {
    it('should return 405 for non-GET methods', async () => {
      mockReq = { method: 'POST' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should return healthy status', async () => {
      const healthResult = {
        status: 'healthy',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        checks: {
          database: { status: 'up' },
          redis: { status: 'up' },
        },
      };

      mockPerformHealthCheck.mockResolvedValue(healthResult);
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'kitchen-service',
          status: 'healthy',
          architecture: 'hexagonal-ddd',
          layers: expect.objectContaining({
            domain: 'Ready',
            application: 'Ready',
            infrastructure: 'Ready',
            presentation: 'Ready',
          }),
        })
      );
    });

    it('should return degraded status', async () => {
      const healthResult = {
        status: 'degraded',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        checks: {
          database: { status: 'up' },
          redis: { status: 'down' },
        },
      };

      mockPerformHealthCheck.mockResolvedValue(healthResult);
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
        })
      );
    });

    it('should return 503 for unhealthy status', async () => {
      const healthResult = {
        status: 'unhealthy',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        checks: {
          database: { status: 'down' },
          redis: { status: 'down' },
        },
      };

      mockPerformHealthCheck.mockResolvedValue(healthResult);
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          layers: expect.objectContaining({
            infrastructure: 'Degraded',
          }),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockPerformHealthCheck.mockRejectedValue(new Error('Health check failed'));
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'kitchen-service',
          status: 'unhealthy',
          error: 'Health check failed',
        })
      );
    });

    it('should handle errors without message', async () => {
      mockPerformHealthCheck.mockRejectedValue({});
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: 'Service unavailable',
        })
      );
    });

    it('should include API endpoints in response', async () => {
      const healthResult = {
        status: 'healthy',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        checks: {
          database: { status: 'up' },
        },
      };

      mockPerformHealthCheck.mockResolvedValue(healthResult);
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoints: expect.arrayContaining([
            expect.stringContaining('GET /api/recipes'),
            expect.stringContaining('GET /api/plates'),
            expect.stringContaining('GET /api/history'),
          ]),
        })
      );
    });
  });
});
