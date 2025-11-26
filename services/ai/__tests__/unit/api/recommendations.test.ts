import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock all dependencies before importing handler
jest.mock('../../../src/context', () => ({
  buildSystemContext: jest.fn(),
}));

jest.mock('../../../src/clients/gemini', () => ({
  generateJSON: jest.fn(),
}));

import handler from '../../../api/recommendations';
import { buildSystemContext } from '../../../src/context';
import { generateJSON } from '../../../src/clients/gemini';

describe('Recommendations API', () => {
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

  describe('GET /api/recommendations', () => {
    it('should return recommendations', async () => {
      mockReq = { method: 'GET' };

      (buildSystemContext as jest.Mock).mockResolvedValue({
        inventory: [{ id: '1', ingredientName: 'tomato', quantity: 5 }],
        recipes: [{ id: '1', name: 'Pizza', ingredients: { cheese: 2 } }],
        purchaseStats: { total: 10, successful: 8, failed: 2 },
        recentFailedPurchases: [],
      });

      (generateJSON as jest.Mock).mockResolvedValue({
        recipeRanking: [{ recipe: 'Pizza', viability: 80, reason: 'Good' }],
        criticalAlerts: [],
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            recipeRanking: expect.any(Array),
            criticalAlerts: expect.any(Array),
          }),
        })
      );
    });

    it('should return 500 when Gemini fails', async () => {
      mockReq = { method: 'GET' };

      (buildSystemContext as jest.Mock).mockResolvedValue({
        inventory: [],
        recipes: [],
        purchaseStats: { total: 0, successful: 0, failed: 0 },
        recentFailedPurchases: [],
      });

      (generateJSON as jest.Mock).mockResolvedValue(null);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to generate recommendations',
        })
      );
    });
  });

  describe('OPTIONS /api/recommendations', () => {
    it('should handle CORS preflight', async () => {
      mockReq = { method: 'OPTIONS' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for POST', async () => {
      mockReq = { method: 'POST' };

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
