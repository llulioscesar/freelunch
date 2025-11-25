import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock logger
jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

import { withLogging, createRequestLogger } from '../../../../src/infrastructure/logging/RequestLogger';
import { logger } from '../../../../src/infrastructure/logging/Logger';

describe('RequestLogger', () => {
  describe('withLogging', () => {
    let mockReq: Partial<VercelRequest>;
    let mockRes: Partial<VercelResponse>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let sendMock: jest.Mock;
    let setHeaderMock: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      jsonMock = jest.fn();
      sendMock = jest.fn();
      setHeaderMock = jest.fn();
      statusMock = jest.fn().mockImplementation(() => ({
        json: jsonMock,
        send: sendMock,
      }));

      mockReq = {
        method: 'GET',
        url: '/api/test',
        headers: {
          'user-agent': 'test-agent',
          'x-forwarded-for': '127.0.0.1',
        },
      };

      mockRes = {
        status: statusMock,
        json: jsonMock,
        send: sendMock,
        setHeader: setHeaderMock,
        headersSent: false,
      };
    });

    it('should log incoming request', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withLogging(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(logger.logRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
        })
      );
    });

    it('should set X-Request-ID header', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withLogging(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(setHeaderMock).toHaveBeenCalledWith('X-Request-ID', expect.stringMatching(/^req_\d+_[a-f0-9]+$/));
    });

    it('should call the original handler', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withLogging(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(handler).toHaveBeenCalledWith(mockReq, expect.any(Object));
    });

    it('should handle handler errors', async () => {
      const error = new Error('Handler error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withLogging(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(logger.error).toHaveBeenCalledWith(
        'Request handler error',
        error,
        expect.objectContaining({
          statusCode: 500,
        })
      );
    });

    it('should handle missing method and url', async () => {
      mockReq = { headers: {} };
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withLogging(handler);

      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(logger.logRequest).toHaveBeenCalledWith(
        'UNKNOWN',
        '/',
        expect.any(Object)
      );
    });
  });

  describe('createRequestLogger', () => {
    it('should create a child logger with request context', () => {
      const mockReq: Partial<VercelRequest> = {
        method: 'POST',
        url: '/api/inventory',
        headers: {
          'user-agent': 'test-agent',
          'x-customer-id': 'cust-123',
        },
      };

      // Call function and discard result - we only care about the mock call
      createRequestLogger(mockReq as VercelRequest);

      expect(logger.child).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/inventory',
          customerId: 'cust-123',
        })
      );
    });
  });
});
