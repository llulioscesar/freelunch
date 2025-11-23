/**
 * Unit Tests: RequestLogger (with mocks)
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withLogging } from '../../../../src/infrastructure/logging/RequestLogger';

// Mock logger
jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from '../../../../src/infrastructure/logging/Logger';

describe('RequestLogger (Unit with Mocks)', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'user-agent': 'Jest Test',
        'x-forwarded-for': '127.0.0.1',
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockHandler = jest.fn().mockResolvedValue(undefined);
  });

  it('should log request on entry', async () => {
    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(logger.logRequest).toHaveBeenCalledWith(
      'GET',
      '/api/test',
      expect.objectContaining({
        requestId: expect.stringContaining('req_'),
        method: 'GET',
        path: '/api/test',
      })
    );
  });

  it('should log response with timing', async () => {
    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Call json to trigger response logging
    (mockRes.json as jest.Mock)({ success: true });

    expect(logger.logResponse).toHaveBeenCalledWith(
      'GET',
      '/api/test',
      200,
      expect.any(Number),
      expect.objectContaining({
        requestId: expect.stringContaining('req_'),
      })
    );
  });

  it('should capture status code from status method', async () => {
    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Call status then json
    (mockRes.status as jest.Mock)(404);
    (mockRes.json as jest.Mock)({ error: 'Not found' });

    expect(logger.logResponse).toHaveBeenCalledWith(
      'GET',
      '/api/test',
      404,
      expect.any(Number),
      expect.any(Object)
    );
  });

  it('should handle send method with string body', async () => {
    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    (mockRes.send as jest.Mock)('Hello World');

    expect(logger.logResponse).toHaveBeenCalledWith(
      'GET',
      '/api/test',
      200,
      expect.any(Number),
      expect.objectContaining({
        responseSize: 11, // 'Hello World'.length
      })
    );
  });

  it('should handle send method with non-string body', async () => {
    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    (mockRes.send as jest.Mock)({ message: 'Hello' });

    expect(logger.logResponse).toHaveBeenCalledWith(
      'GET',
      '/api/test',
      200,
      expect.any(Number),
      expect.objectContaining({
        responseSize: expect.any(Number),
      })
    );
  });

  it('should log errors when handler throws', async () => {
    const error = new Error('Handler error');
    mockHandler.mockRejectedValue(error);

    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(logger.error).toHaveBeenCalledWith(
      'Request handler error',
      error,
      expect.any(Object)
    );
  });

  it('should extract custom headers', async () => {
    mockReq.headers = {
      ...mockReq.headers,
      'x-customer-id': 'cust-123',
      'x-user-id': 'user-456',
    };

    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(logger.logRequest).toHaveBeenCalledWith(
      'GET',
      '/api/test',
      expect.objectContaining({
        customerId: 'cust-123',
        userId: 'user-456',
      })
    );
  });

  it('should handle x-real-ip header', async () => {
    mockReq.headers = {
      'user-agent': 'Jest Test',
      'x-real-ip': '192.168.1.1',
    };

    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(logger.logRequest).toHaveBeenCalledWith(
      'GET',
      '/api/test',
      expect.objectContaining({
        ip: '192.168.1.1',
      })
    );
  });

  it('should call original handler', async () => {
    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes);
  });

  it('should handle missing method and url', async () => {
    const mockReqNoMethodUrl: Partial<VercelRequest> = {
      headers: {
        'user-agent': 'Jest Test',
      },
    };

    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReqNoMethodUrl as VercelRequest, mockRes as VercelResponse);

    expect(logger.logRequest).toHaveBeenCalledWith(
      'UNKNOWN',
      '/',
      expect.any(Object)
    );
  });

  it('should handle errors with development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Handler error');
    mockHandler.mockRejectedValue(error);

    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Just verify error was logged correctly
    expect(logger.error).toHaveBeenCalledWith(
      'Request handler error',
      error,
      expect.any(Object)
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle errors in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Handler error');
    mockHandler.mockRejectedValue(error);

    const wrappedHandler = withLogging(mockHandler);

    await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Just verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      'Request handler error',
      error,
      expect.any(Object)
    );

    process.env.NODE_ENV = originalEnv;
  });
});

describe('createRequestLogger', () => {
  beforeEach(() => {
    // Mock logger.child to return a child logger
    (logger.child as jest.Mock) = jest.fn().mockReturnValue(logger);
  });

  it('should create a request-scoped logger', () => {
    const mockReq: Partial<VercelRequest> = {
      method: 'POST',
      url: '/api/orders',
      headers: {
        'user-agent': 'Jest Test',
        'x-forwarded-for': '127.0.0.1',
      },
    };

    const { createRequestLogger } = require('../../../../src/infrastructure/logging/RequestLogger');
    const requestLogger = createRequestLogger(mockReq as VercelRequest);

    expect(requestLogger).toBeDefined();
    expect(logger.child).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: expect.stringContaining('req_'),
        method: 'POST',
        path: '/api/orders',
      })
    );
  });
});
