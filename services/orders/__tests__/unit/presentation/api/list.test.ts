/**
 * Unit Tests: List Orders API Endpoint (with mocks)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies
jest.mock('../../../../src/infrastructure/config/dependencies', () => ({
  dependencies: {
    listOrdersUseCase: {
      execute: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/infrastructure/metrics/MetricsMiddleware', () => ({
  withMetrics: (handler: any) => handler,
}));

import { dependencies } from '../../../../src/infrastructure/config/dependencies';

// Import handler after mocks
let handler: any;

beforeAll(async () => {
  // Dynamic import after mocks are set
  const module = await import('../../../../src/presentation/api/list');
  handler = module.default;
});

describe('List Orders API (Unit with Mocks)', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'GET',
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should list orders successfully', async () => {
    (dependencies.listOrdersUseCase.execute as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'ORD-123-ABC',
          quantity: 5,
          status: 'PENDING',
          customerName: 'John Doe',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array),
        pagination: expect.any(Object),
      })
    );
  });

  it('should apply query parameters', async () => {
    mockReq.query = {
      page: '2',
      limit: '20',
      status: 'PENDING',
      customerName: 'John',
    };

    (dependencies.listOrdersUseCase.execute as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 0,
      },
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(dependencies.listOrdersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 20,
        status: 'PENDING',
        customerName: 'John',
      })
    );
  });

  it('should use default pagination values', async () => {
    (dependencies.listOrdersUseCase.execute as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(dependencies.listOrdersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
      })
    );
  });

  it('should return 405 for non-GET methods', async () => {
    mockReq.method = 'POST';

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it('should handle errors', async () => {
    (dependencies.listOrdersUseCase.execute as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Database error',
      })
    );
  });

  it('should handle unknown errors', async () => {
    (dependencies.listOrdersUseCase.execute as jest.Mock).mockRejectedValue('Unknown error');

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
