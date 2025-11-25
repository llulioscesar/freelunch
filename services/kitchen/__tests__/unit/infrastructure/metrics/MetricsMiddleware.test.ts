import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock metricsService before import
const mockMetricsService = {
  recordHttpRequest: jest.fn(),
  recordDatabaseQuery: jest.fn(),
};

jest.mock('../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: mockMetricsService,
}));

import { withMetrics, measureAsync, measure } from '../../../../src/infrastructure/metrics/MetricsMiddleware';

describe('MetricsMiddleware', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
      writableEnded: false,
    };
    mockReq = {
      method: 'GET',
      url: '/api/test',
    };
  });

  describe('withMetrics', () => {
    it('should record metrics when json is called', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.status(200).json({ success: true });
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(handler).toHaveBeenCalled();
      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        200,
        expect.any(Number)
      );
    });

    it('should record metrics when send is called', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.status(200).send('OK');
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        200,
        expect.any(Number)
      );
    });

    it('should capture status code from status method', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.status(404).json({ error: 'Not found' });
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        404,
        expect.any(Number)
      );
    });

    it('should record error metrics when handler throws', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      const wrappedHandler = withMetrics(handler);
      await expect(
        wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse)
      ).rejects.toThrow('Handler error');

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        500,
        expect.any(Number)
      );
    });

    it('should record metrics when response not sent yet', async () => {
      const handler = jest.fn().mockImplementation(async () => {
        // Handler doesn't send response
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalled();
    });

    it('should handle POST requests', async () => {
      mockReq.method = 'POST';
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({ created: true });
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
        'POST',
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle undefined method', async () => {
      mockReq.method = undefined;
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({});
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
        'UNKNOWN',
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle undefined URL', async () => {
      mockReq.url = undefined;
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({});
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalled();
    });

    it('should extract endpoint name from URL with query string', async () => {
      mockReq.url = '/api/test?foo=bar&baz=qux';
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({});
      });

      const wrappedHandler = withMetrics(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('measureAsync', () => {
    it('should record metrics for successful async operations', async () => {
      const result = await measureAsync('test_operation', async () => 'success');

      expect(result).toBe('success');
      expect(mockMetricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'test_operation',
        expect.any(Number),
        false
      );
    });

    it('should record metrics for failed async operations', async () => {
      await expect(
        measureAsync('test_operation', async () => {
          throw new Error('Async error');
        })
      ).rejects.toThrow('Async error');

      expect(mockMetricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'test_operation',
        expect.any(Number),
        true
      );
    });
  });

  describe('measure', () => {
    it('should record metrics for successful sync operations', () => {
      const result = measure('test_operation', () => 'success');

      expect(result).toBe('success');
      expect(mockMetricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'test_operation',
        expect.any(Number),
        false
      );
    });

    it('should record metrics for failed sync operations', () => {
      expect(() =>
        measure('test_operation', () => {
          throw new Error('Sync error');
        })
      ).toThrow('Sync error');

      expect(mockMetricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'test_operation',
        expect.any(Number),
        true
      );
    });
  });
});
