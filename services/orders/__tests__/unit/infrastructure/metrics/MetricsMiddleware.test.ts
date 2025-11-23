/**
 * Unit Tests: MetricsMiddleware (with mocks)
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withMetrics, measureAsync, measure } from '../../../../src/infrastructure/metrics/MetricsMiddleware';

// Mock metrics service
jest.mock('../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: {
    recordHttpRequest: jest.fn(),
    recordDatabaseQuery: jest.fn(),
  },
}));

import { metricsService } from '../../../../src/infrastructure/metrics/MetricsService';

describe('MetricsMiddleware (Unit with Mocks)', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'POST',
      url: '/api/orders',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      writableEnded: false,
    };

    mockHandler = jest.fn().mockResolvedValue(undefined);
  });

  it('should record metrics when json is called', async () => {
    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    (mockRes.json as jest.Mock)({ success: true });

    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'POST',
      expect.stringContaining('orders'),
      200,
      expect.any(Number)
    );
  });

  it('should record metrics when send is called', async () => {
    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    (mockRes.send as jest.Mock)('OK');

    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'POST',
      expect.stringContaining('orders'),
      200,
      expect.any(Number)
    );
  });

  it('should capture status code from status method', async () => {
    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    (mockRes.status as jest.Mock)(201);
    (mockRes.json as jest.Mock)({ id: '123' });

    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'POST',
      expect.any(String),
      201,
      expect.any(Number)
    );
  });

  it('should record error metrics when handler throws', async () => {
    mockHandler.mockRejectedValue(new Error('Handler error'));

    const wrappedHandler = withMetrics(mockHandler);

    await expect(
      wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse)
    ).rejects.toThrow('Handler error');

    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'POST',
      expect.any(String),
      500,
      expect.any(Number)
    );
  });

  it('should record metrics when response not sent', async () => {
    mockRes.writableEnded = false;

    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(metricsService.recordHttpRequest).toHaveBeenCalled();
  });

  it('should handle GET requests', async () => {
    mockReq.method = 'GET';
    mockReq.url = '/api/orders/123';

    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);
    (mockRes.json as jest.Mock)({ id: '123' });

    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'GET',
      expect.stringContaining('orders'),
      200,
      expect.any(Number)
    );
  });

  it('should handle DELETE requests', async () => {
    mockReq.method = 'DELETE';

    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);
    (mockRes.json as jest.Mock)({ success: true });

    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'DELETE',
      expect.any(String),
      200,
      expect.any(Number)
    );
  });

  it('should call original handler', async () => {
    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes);
  });

  it('should handle undefined method', async () => {
    mockReq.method = undefined;

    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);
    (mockRes.json as jest.Mock)({});

    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'UNKNOWN',
      expect.any(String),
      200,
      expect.any(Number)
    );
  });
});

describe('measureAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record metrics for successful async operations', async () => {
    const operation = 'findUser';
    const asyncFn = jest.fn().mockResolvedValue({ id: '123' });

    const result = await measureAsync(operation, asyncFn);

    expect(result).toEqual({ id: '123' });
    expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
      operation,
      expect.any(Number),
      false
    );
  });

  it('should record metrics for failed async operations', async () => {
    const operation = 'findUser';
    const asyncFn = jest.fn().mockRejectedValue(new Error('DB error'));

    await expect(measureAsync(operation, asyncFn)).rejects.toThrow('DB error');

    expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
      operation,
      expect.any(Number),
      true
    );
  });
});

describe('measure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record metrics for successful sync operations', () => {
    const operation = 'validateData';
    const syncFn = jest.fn().mockReturnValue({ valid: true });

    const result = measure(operation, syncFn);

    expect(result).toEqual({ valid: true });
    expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
      operation,
      expect.any(Number),
      false
    );
  });

  it('should record metrics for failed sync operations', () => {
    const operation = 'validateData';
    const syncFn = jest.fn().mockImplementation(() => {
      throw new Error('Validation error');
    });

    expect(() => measure(operation, syncFn)).toThrow('Validation error');

    expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
      operation,
      expect.any(Number),
      true
    );
  });
});

describe('getEndpointName (via withMetrics)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle malformed URLs by falling back to split', async () => {
    const mockReq: Partial<VercelRequest> = {
      method: 'GET',
      url: 'not-a-valid-url?with=params',
    };

    const mockRes: Partial<VercelResponse> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      writableEnded: false,
    };

    const mockHandler = jest.fn().mockResolvedValue(undefined);
    const wrappedHandler = withMetrics(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);
    (mockRes.json as jest.Mock)({ success: true });

    // Should still record metrics even with malformed URL
    expect(metricsService.recordHttpRequest).toHaveBeenCalled();
  });
});
