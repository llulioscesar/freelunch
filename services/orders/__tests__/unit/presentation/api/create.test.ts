/**
 * Unit Tests: Create Order API Endpoint (with mocks)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies
jest.mock('../../../../src/infrastructure/config/dependencies', () => ({
  dependencies: {
    createOrderUseCase: {
      execute: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../src/infrastructure/logging/RequestLogger', () => ({
  withLogging: (handler: any) => handler,
}));

jest.mock('../../../../src/infrastructure/metrics/MetricsMiddleware', () => ({
  withMetrics: (handler: any) => handler,
}));

import { dependencies } from '../../../../src/infrastructure/config/dependencies';

// Import handler after mocks
let handler: any;

beforeAll(async () => {
  // Dynamic import after mocks are set
  const module = await import('../../../../src/presentation/api/create');
  handler = module.default;
});

describe('Create Order API (Unit with Mocks)', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'POST',
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  it('should create order successfully', async () => {
    mockReq.body = {
      quantity: 5,
      customerName: 'John Doe',
      notes: 'No onions',
    };

    (dependencies.createOrderUseCase.execute as jest.Mock).mockResolvedValue({
      success: true,
      order: {
        id: 'ORD-123-ABC',
        quantity: 5,
        status: 'PENDING',
        customerName: 'John Doe',
      },
      message: 'Order created successfully',
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        order: expect.any(Object),
      })
    );
  });

  it('should return 400 for invalid request', async () => {
    mockReq.body = {
      quantity: -1, // Invalid
    };

    (dependencies.createOrderUseCase.execute as jest.Mock).mockRejectedValue(
      new Error('Quantity must be at least 1')
    );

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should return 405 for non-POST methods', async () => {
    mockReq.method = 'GET';

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it('should handle server errors', async () => {
    mockReq.body = {
      quantity: 5,
    };

    (dependencies.createOrderUseCase.execute as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should handle unknown errors (non-Error objects)', async () => {
    mockReq.body = {
      quantity: 5,
    };

    (dependencies.createOrderUseCase.execute as jest.Mock).mockRejectedValue(
      'String error'
    );

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal server error',
      })
    );
  });
});
