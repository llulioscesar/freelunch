import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock all dependencies before importing handler
jest.mock('../../../src/context', () => ({
  buildSystemContext: jest.fn(),
}));

jest.mock('../../../src/clients/gemini', () => ({
  generateWithTools: jest.fn(),
}));

import handler from '../../../api/chat';
import { buildSystemContext } from '../../../src/context';
import { generateWithTools } from '../../../src/clients/gemini';

describe('Chat API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

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
  });

  describe('POST /api/chat', () => {
    it('should return chat response', async () => {
      mockReq = {
        method: 'POST',
        body: { message: 'What can I cook?' },
      };

      (buildSystemContext as jest.Mock).mockResolvedValue({
        inventory: [{ id: '1', ingredientName: 'tomato', quantity: 5 }],
        recipes: [{ id: '1', name: 'Pizza', ingredients: { cheese: 2 } }],
        purchaseStats: { total: 10, successful: 8, failed: 2 },
        recentFailedPurchases: [],
      });

      (generateWithTools as jest.Mock).mockResolvedValue('You can make Pizza!');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            response: 'You can make Pizza!',
            conversationId: expect.any(String),
          }),
        })
      );
    });

    it('should return 400 when message is missing', async () => {
      mockReq = {
        method: 'POST',
        body: {},
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Message is required',
        })
      );
    });

    it('should use provided conversationId', async () => {
      mockReq = {
        method: 'POST',
        body: { message: 'Hello', conversationId: 'conv-123' },
      };

      (buildSystemContext as jest.Mock).mockResolvedValue({
        inventory: [],
        recipes: [],
        purchaseStats: { total: 0, successful: 0, failed: 0 },
        recentFailedPurchases: [],
      });

      (generateWithTools as jest.Mock).mockResolvedValue('Hi there!');

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: 'conv-123',
          }),
        })
      );
    });
  });

  describe('OPTIONS /api/chat', () => {
    it('should handle CORS preflight', async () => {
      mockReq = { method: 'OPTIONS' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for GET', async () => {
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Method not allowed',
        })
      );
    });
  });
});
