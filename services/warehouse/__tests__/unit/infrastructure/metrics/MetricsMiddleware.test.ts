import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock metricsService
jest.mock('../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: {
    recordHttpRequest: jest.fn(),
    recordDatabaseQuery: jest.fn(),
  },
}));

import { withMetrics, measureAsync, measure } from '../../../../src/infrastructure/metrics/MetricsMiddleware';
import { metricsService } from '../../../../src/infrastructure/metrics/MetricsService';

describe('MetricsMiddleware', () => {
  describe('withMetrics', () => {
    let mockReq: Partial<VercelRequest>;
    let mockRes: Partial<VercelResponse>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let sendMock: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      jsonMock = jest.fn();
      sendMock = jest.fn();
      statusMock = jest.fn().mockImplementation(() => ({
        json: jsonMock,
        send: sendMock,
      }));

      mockReq = {
        method: 'GET',
        url: '/api/test?param=value',
      };

      mockRes = {
        status: statusMock,
        json: jsonMock,
        send: sendMock,
        writableEnded: false,
      };
    });

    it('should record metrics for successful requests', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.status(200).json({ success: true });
      });
      const wrappedHandler = withMetrics(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        200,
        expect.any(Number)
      );
    });

    it('should record metrics with correct status code', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.status(404).json({ error: 'Not found' });
      });
      const wrappedHandler = withMetrics(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        404,
        expect.any(Number)
      );
    });

    it('should record metrics for errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = withMetrics(handler);

      await expect(
        wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse)
      ).rejects.toThrow('Handler error');

      expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        500,
        expect.any(Number)
      );
    });

    it('should handle missing method and url', async () => {
      mockReq = {};
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({ success: true });
      });
      const wrappedHandler = withMetrics(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
        'UNKNOWN',
        '/',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should extract endpoint name without query params', async () => {
      mockReq = { method: 'POST', url: '/api/inventory?limit=10&offset=0' };
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({ success: true });
      });
      const wrappedHandler = withMetrics(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/api/inventory',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle send() method', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.send('OK');
      });
      const wrappedHandler = withMetrics(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(metricsService.recordHttpRequest).toHaveBeenCalled();
    });
  });

  describe('measureAsync', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should measure successful async operation', async () => {
      const result = await measureAsync('SELECT', async () => {
        return { data: 'test' };
      });

      expect(result).toEqual({ data: 'test' });
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'SELECT',
        expect.any(Number),
        false
      );
    });

    it('should measure failed async operation', async () => {
      await expect(
        measureAsync('INSERT', async () => {
          throw new Error('DB error');
        })
      ).rejects.toThrow('DB error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'INSERT',
        expect.any(Number),
        true
      );
    });
  });

  describe('measure', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should measure successful sync operation', () => {
      const result = measure('COMPUTE', () => {
        return 42;
      });

      expect(result).toBe(42);
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'COMPUTE',
        expect.any(Number),
        false
      );
    });

    it('should measure failed sync operation', () => {
      expect(() =>
        measure('PARSE', () => {
          throw new Error('Parse error');
        })
      ).toThrow('Parse error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'PARSE',
        expect.any(Number),
        true
      );
    });
  });
});
