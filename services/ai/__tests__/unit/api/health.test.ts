import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../../api/health';

describe('Health API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    const endMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, end: endMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
      end: endMock,
      setHeader: jest.fn(),
    };
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/health', () => {
    it('should return healthy when Gemini is configured', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          service: 'ai',
          status: 'healthy',
          config: expect.objectContaining({
            geminiConfigured: true,
          }),
        })
      );
    });

    it('should return degraded when Gemini is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          config: expect.objectContaining({
            geminiConfigured: false,
          }),
        })
      );
    });
  });

  describe('OPTIONS /api/health', () => {
    it('should handle CORS preflight', async () => {
      mockReq = { method: 'OPTIONS' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
