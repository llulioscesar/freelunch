import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies before import
const mockGetRecipesUseCase = {
  execute: jest.fn(),
};

jest.mock('../../../../src/infrastructure/config/dependencies', () => ({
  dependencies: {
    getRecipesUseCase: mockGetRecipesUseCase,
  },
}));

jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../../src/infrastructure/metrics/MetricsMiddleware', () => ({
  withMetrics: (handler: any) => handler,
}));

import handler from '../../../../src/presentation/api/recipes';

describe('Recipes API', () => {
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

  describe('GET /api/recipes', () => {
    it('should return 405 for non-GET methods', async () => {
      mockReq = { method: 'POST', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should return recipes list successfully', async () => {
      const recipes = [
        {
          id: 'recipe-1',
          name: 'Pizza Margherita',
          ingredients: { tomato: 2, mozzarella: 1, basil: 3 },
        },
        {
          id: 'recipe-2',
          name: 'Caesar Salad',
          ingredients: { lettuce: 1, chicken: 1, parmesan: 1 },
        },
      ];

      mockGetRecipesUseCase.execute.mockResolvedValue({ recipes });
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockGetRecipesUseCase.execute).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ recipes });
    });

    it('should return empty array when no recipes', async () => {
      mockGetRecipesUseCase.execute.mockResolvedValue({ recipes: [] });
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ recipes: [] });
    });

    it('should handle use case errors', async () => {
      mockGetRecipesUseCase.execute.mockRejectedValue(new Error('Database error'));
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Database error' });
    });

    it('should handle unknown errors', async () => {
      mockGetRecipesUseCase.execute.mockRejectedValue('Unknown error');
      mockReq = { method: 'GET', query: {} };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to fetch recipes',
      });
    });
  });
});
