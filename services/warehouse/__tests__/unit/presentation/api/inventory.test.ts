import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock the entire module chain before importing
jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaInventoryRepository', () => ({
  PrismaInventoryRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
    findByIngredientName: jest.fn().mockResolvedValue(null),
    saveMany: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import after mocking
import handler from '../../../../src/presentation/api/inventory';

describe('Inventory API', () => {
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

  describe('GET /api/inventory', () => {
    it('should return inventory', async () => {
      mockReq = { method: 'GET' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('POST /api/inventory', () => {
    it('should initialize inventory', async () => {
      mockReq = { method: 'POST' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Inventory initialized'),
        })
      );
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for PUT', async () => {
      mockReq = { method: 'PUT' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Method not allowed',
        })
      );
    });

    it('should return 405 for DELETE', async () => {
      mockReq = { method: 'DELETE' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
    });
  });
});
