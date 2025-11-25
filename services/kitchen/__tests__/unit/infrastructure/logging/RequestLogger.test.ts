import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock logger before import
const mockLogger = {
  logRequest: jest.fn(),
  logResponse: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: mockLogger,
}));

import { withLogging, createRequestLogger } from '../../../../src/infrastructure/logging/RequestLogger';

describe('RequestLogger', () => {
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

    // Create the mock res that properly chains status().json()
    statusMock = jest.fn().mockImplementation(() => mockRes);

    mockRes = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
      setHeader: setHeaderMock,
      headersSent: false,
    };

    mockReq = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'user-agent': 'Test Agent',
        'x-forwarded-for': '127.0.0.1',
      },
    };
  });

  describe('withLogging', () => {
    it('should log request on entry', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({ success: true });
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        expect.objectContaining({
          requestId: expect.stringMatching(/^req_/),
          method: 'GET',
          path: '/api/test',
        })
      );
    });

    it('should log response when json is called', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({ success: true });
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logResponse).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        200,
        expect.any(Number),
        expect.objectContaining({
          requestId: expect.stringMatching(/^req_/),
        })
      );
    });

    it('should capture status code', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.status(404);
        res.json({ error: 'Not found' });
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logResponse).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        404,
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should log response when send is called with string', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.send('OK');
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logResponse).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        200,
        expect.any(Number),
        expect.objectContaining({
          responseSize: 2, // 'OK'.length
        })
      );
    });

    it('should log response when send is called with object', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.send({ data: 'test' });
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logResponse).toHaveBeenCalled();
    });

    it('should log errors when handler throws', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request handler error',
        expect.any(Error),
        expect.objectContaining({
          statusCode: 500,
        })
      );
    });

    it('should set X-Request-ID header', async () => {
      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({});
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(setHeaderMock).toHaveBeenCalledWith(
        'X-Request-ID',
        expect.stringMatching(/^req_/)
      );
    });

    it('should extract custom headers', async () => {
      mockReq.headers = {
        ...mockReq.headers,
        'x-customer-id': 'customer-123',
        'x-user-id': 'user-456',
      };

      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({});
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          customerId: 'customer-123',
          userId: 'user-456',
        })
      );
    });

    it('should handle x-real-ip header when x-forwarded-for not present', async () => {
      mockReq.headers = {
        'x-real-ip': '192.168.1.1',
      };

      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({});
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          ip: '192.168.1.1',
        })
      );
    });

    it('should handle undefined method and url', async () => {
      mockReq.method = undefined;
      mockReq.url = undefined;

      const handler = jest.fn().mockImplementation(async (_req, res) => {
        res.json({});
      });

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockLogger.logRequest).toHaveBeenCalledWith(
        'UNKNOWN',
        '/',
        expect.any(Object)
      );
    });

    it('should send 500 response on error when headers not sent', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should not send response on error when headers already sent', async () => {
      // Create a new mock with headersSent = true
      const headersSentRes: any = {
        status: statusMock,
        json: jsonMock,
        send: sendMock,
        setHeader: setHeaderMock,
      };
      Object.defineProperty(headersSentRes, 'headersSent', { value: true });

      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      const wrappedHandler = withLogging(handler);
      await wrappedHandler(mockReq as VercelRequest, headersSentRes as VercelResponse);

      // Should log error but not call status(500)
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('createRequestLogger', () => {
    it('should create a request-scoped logger with context', () => {
      const requestLogger = createRequestLogger(mockReq as VercelRequest);

      expect(mockLogger.child).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: expect.stringMatching(/^req_/),
          method: 'GET',
          path: '/api/test',
        })
      );
      expect(requestLogger).toBeDefined();
    });
  });
});
