/**
 * E2E Tests: Create Order API Endpoint
 *
 * These tests simulate real HTTP requests to the create order endpoint.
 * They test the full stack from HTTP request to database persistence.
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import createOrderHandler from '../../../src/presentation/api/create';

// Mock response object
const createMockResponse = (): Partial<VercelResponse> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock request object
const createMockRequest = (overrides: Partial<VercelRequest> = {}): Partial<VercelRequest> => {
  return {
    method: 'POST',
    body: {},
    query: {},
    headers: {},
    ...overrides,
  };
};

describe('E2E: POST /api/create - Create Order', () => {
  describe('successful order creation', () => {
    it('should create order with valid data', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 5,
          customerName: 'John Doe',
          notes: 'No onions',
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.order).toBeDefined();
      expect(response.order.id).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(response.order.quantity).toBe(5);
      expect(response.order.status).toBe('PENDING');
      expect(response.order.customerName).toBe('John Doe');
      expect(response.message).toBe('Order created successfully and sent to kitchen');
    });

    it('should create order with minimal data', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 1,
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(201);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.order.quantity).toBe(1);
      expect(response.order.customerName).toBe('Guest');
    });

    it('should create order without notes', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 3,
          customerName: 'Jane Smith',
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(201);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.order.customerName).toBe('Jane Smith');
    });

    it('should create order with maximum quantity', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 100,
          customerName: 'Big Event Corp',
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(201);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.order.quantity).toBe(100);
    });

    it('should return createdAt timestamp', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 2,
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.order.createdAt).toBeDefined();
      expect(new Date(response.order.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('validation errors', () => {
    it('should reject quantity of 0', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 0,
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBeDefined();
    });

    it('should reject negative quantity', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: -5,
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject quantity over 100', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 101,
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject non-integer quantity', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 5.5,
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject missing quantity', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          customerName: 'John Doe',
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBe('Invalid request');
      expect(response.details).toBeDefined();
    });

    it('should reject invalid data types', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 'five',
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('HTTP method validation', () => {
    it('should reject GET requests', async () => {
      const req = createMockRequest({
        method: 'GET',
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBe('Method not allowed');
    });

    it('should reject PUT requests', async () => {
      const req = createMockRequest({
        method: 'PUT',
        body: { quantity: 5 },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should reject DELETE requests', async () => {
      const req = createMockRequest({
        method: 'DELETE',
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('special characters handling', () => {
    it('should handle special characters in customer name', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 1,
          customerName: "O'Brien & Sons <Corp>",
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(201);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.order.customerName).toBe("O'Brien & Sons <Corp>");
    });

    it('should handle unicode characters in notes', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          quantity: 1,
          notes: 'Extra spicy 🌶️🔥',
        },
      });

      const res = createMockResponse();

      await createOrderHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent orders', async () => {
      const requests = Array(5).fill(null).map(() =>
        createMockRequest({
          method: 'POST',
          body: {
            quantity: 1,
            customerName: 'Concurrent Customer',
          },
        })
      );

      const responses = await Promise.all(
        requests.map(async (req) => {
          const res = createMockResponse();
          await createOrderHandler(req as VercelRequest, res as VercelResponse);
          return res;
        })
      );

      responses.forEach(res => {
        expect(res.status).toHaveBeenCalledWith(201);
      });

      // Verify all order IDs are unique
      const orderIds = responses.map(res => {
        const response = (res.json as jest.Mock).mock.calls[0][0];
        return response.order.id;
      });

      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).toBe(5);
    });
  });
});
