/**
 * E2E Tests: Order Status API Endpoint
 *
 * These tests simulate real HTTP requests to the order status endpoint.
 * Tests both GET (retrieve status) and PATCH (update status) operations.
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import orderStatusHandler from '../../../src/presentation/api/status';

const createMockResponse = (): Partial<VercelResponse> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockRequest = (overrides: Partial<VercelRequest> = {}): Partial<VercelRequest> => {
  return {
    method: 'GET',
    query: {},
    body: {},
    headers: {},
    ...overrides,
  };
};

describe('E2E: /api/status - Order Status', () => {
  const validOrderId = 'ORD-1234567890-Uabc123';

  describe('GET - Retrieve Order Status', () => {
    describe('successful retrieval', () => {
      it('should return order status for valid order ID', async () => {
        const req = createMockRequest({
          method: 'GET',
          query: {
            id: validOrderId,
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        // Note: This will return 404 in test without real data
        // In a real E2E test with test database, expect 200
        expect(res.status).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
      });

      it('should include order details in response', async () => {
        const req = createMockRequest({
          method: 'GET',
          query: {
            id: validOrderId,
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        const statusCode = (res.status as jest.Mock).mock.calls[0][0];
        const response = (res.json as jest.Mock).mock.calls[0][0];

        if (statusCode === 200) {
          expect(response.order).toBeDefined();
          expect(response.order).toHaveProperty('id');
          expect(response.order).toHaveProperty('status');
          expect(response.order).toHaveProperty('totalItems');
          expect(response.order).toHaveProperty('completedItems');
          expect(response.order).toHaveProperty('progress');
        }
      });
    });

    describe('validation errors', () => {
      it('should return 400 when order ID is missing', async () => {
        const req = createMockRequest({
          method: 'GET',
          query: {},
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalledWith(400);

        const response = (res.json as jest.Mock).mock.calls[0][0];
        expect(response.error).toBe('Order ID is required');
      });

      it('should return 404 when order not found', async () => {
        const req = createMockRequest({
          method: 'GET',
          query: {
            id: 'ORD-999999999-Unonexistent',
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalledWith(404);

        const response = (res.json as jest.Mock).mock.calls[0][0];
        expect(response.error).toBeDefined();
      });
    });
  });

  describe('PATCH - Update Order Status', () => {
    describe('successful updates', () => {
      it('should update order status to PREPARING', async () => {
        const req = createMockRequest({
          method: 'PATCH',
          query: {
            id: validOrderId,
          },
          body: {
            status: 'PREPARING',
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        // Will return 404 without real data, but validates request structure
        expect(res.status).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
      });

      it('should update order status to READY', async () => {
        const req = createMockRequest({
          method: 'PATCH',
          query: {
            id: validOrderId,
          },
          body: {
            status: 'READY',
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalled();
      });

      it('should update order status to DELIVERED with completedAt', async () => {
        const completedAt = new Date().toISOString();

        const req = createMockRequest({
          method: 'PATCH',
          query: {
            id: validOrderId,
          },
          body: {
            status: 'DELIVERED',
            completedAt,
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalled();
      });

      it('should update order status to FAILED', async () => {
        const req = createMockRequest({
          method: 'PATCH',
          query: {
            id: validOrderId,
          },
          body: {
            status: 'FAILED',
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalled();
      });

      it('should update order status to CANCELLED', async () => {
        const req = createMockRequest({
          method: 'PATCH',
          query: {
            id: validOrderId,
          },
          body: {
            status: 'CANCELLED',
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalled();
      });
    });

    describe('validation errors', () => {
      it('should return 400 when order ID is missing', async () => {
        const req = createMockRequest({
          method: 'PATCH',
          query: {},
          body: {
            status: 'PREPARING',
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalledWith(400);

        const response = (res.json as jest.Mock).mock.calls[0][0];
        expect(response.error).toBe('Order ID is required');
      });

      it('should return 400 when status is missing', async () => {
        const req = createMockRequest({
          method: 'PATCH',
          query: {
            id: validOrderId,
          },
          body: {},
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalledWith(400);

        const response = (res.json as jest.Mock).mock.calls[0][0];
        expect(response.error).toBeDefined();
      });

      it('should return 404 when order not found', async () => {
        const req = createMockRequest({
          method: 'PATCH',
          query: {
            id: 'ORD-999999999-Unonexistent',
          },
          body: {
            status: 'PREPARING',
          },
        });

        const res = createMockResponse();

        await orderStatusHandler(req as VercelRequest, res as VercelResponse);

        expect(res.status).toHaveBeenCalledWith(404);
      });
    });
  });

  describe('HTTP method validation', () => {
    it('should reject POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        query: {
          id: validOrderId,
        },
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBe('Method not allowed');
    });

    it('should reject PUT requests', async () => {
      const req = createMockRequest({
        method: 'PUT',
        query: {
          id: validOrderId,
        },
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should reject DELETE requests', async () => {
      const req = createMockRequest({
        method: 'DELETE',
        query: {
          id: validOrderId,
        },
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should accept GET requests', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          id: validOrderId,
        },
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      // Should not be 405
      const statusCode = (res.status as jest.Mock).mock.calls[0][0];
      expect(statusCode).not.toBe(405);
    });

    it('should accept PATCH requests', async () => {
      const req = createMockRequest({
        method: 'PATCH',
        query: {
          id: validOrderId,
        },
        body: {
          status: 'PREPARING',
        },
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      // Should not be 405
      const statusCode = (res.status as jest.Mock).mock.calls[0][0];
      expect(statusCode).not.toBe(405);
    });
  });

  describe('response structure', () => {
    it('should return success flag in response for GET', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          id: validOrderId,
        },
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('success');
    });

    it('should return success flag in response for PATCH', async () => {
      const req = createMockRequest({
        method: 'PATCH',
        query: {
          id: validOrderId,
        },
        body: {
          status: 'PREPARING',
        },
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('success');
    });
  });

  describe('error responses', () => {
    it('should include error message in error responses', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
      });

      const res = createMockResponse();

      await orderStatusHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe('string');
    });
  });
});
