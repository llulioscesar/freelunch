/**
 * E2E Tests: List Orders API Endpoint
 *
 * These tests simulate real HTTP requests to the list orders endpoint.
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import listOrdersHandler from '../../../src/presentation/api/list';

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
    headers: {},
    ...overrides,
  };
};

describe('E2E: GET /api/list - List Orders', () => {
  describe('successful retrieval', () => {
    it('should return list of orders with default pagination', async () => {
      const req = createMockRequest({
        method: 'GET',
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('orders');
      expect(response).toHaveProperty('pagination');
      expect(Array.isArray(response.orders)).toBe(true);
    });

    it('should return pagination metadata', async () => {
      const req = createMockRequest({
        method: 'GET',
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.pagination).toHaveProperty('page');
      expect(response.pagination).toHaveProperty('limit');
      expect(response.pagination).toHaveProperty('total');
      expect(response.pagination).toHaveProperty('totalPages');
    });
  });

  describe('pagination', () => {
    it('should accept custom page parameter', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          page: '2',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.pagination.page).toBe(2);
    });

    it('should accept custom limit parameter', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          limit: '20',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.pagination.limit).toBe(20);
    });

    it('should use default page 1 if not specified', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.pagination.page).toBe(1);
    });

    it('should use default limit 10 if not specified', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.pagination.limit).toBe(10);
    });
  });

  describe('filtering', () => {
    it('should filter by status', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          status: 'PENDING',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      // All returned orders should have PENDING status
      response.orders.forEach((order: any) => {
        expect(order.status).toBe('PENDING');
      });
    });

    it('should filter by customer name', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          customerName: 'John',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by date range', async () => {
      const fromDate = new Date('2025-01-01').toISOString();
      const toDate = new Date('2025-12-31').toISOString();

      const req = createMockRequest({
        method: 'GET',
        query: {
          fromDate,
          toDate,
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should combine multiple filters', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          status: 'PENDING',
          customerName: 'John',
          limit: '5',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('sorting', () => {
    it('should sort by createdAt descending by default', async () => {
      const req = createMockRequest({
        method: 'GET',
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      if (response.orders.length > 1) {
        const dates = response.orders.map((o: any) => new Date(o.createdAt).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    it('should accept custom sortBy parameter', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          sortBy: 'updatedAt',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept custom sortOrder parameter', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          sortOrder: 'asc',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('HTTP method validation', () => {
    it('should reject POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBe('Method not allowed');
    });

    it('should reject PUT requests', async () => {
      const req = createMockRequest({
        method: 'PUT',
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should reject DELETE requests', async () => {
      const req = createMockRequest({
        method: 'DELETE',
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('order data structure', () => {
    it('should return orders with complete information', async () => {
      const req = createMockRequest({
        method: 'GET',
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      const response = (res.json as jest.Mock).mock.calls[0][0];

      if (response.orders.length > 0) {
        const order = response.orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('quantity');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('customerName');
        expect(order).toHaveProperty('createdAt');
      }
    });
  });

  describe('empty results', () => {
    it('should return empty array when no orders match filters', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {
          customerName: 'NonExistentCustomer12345',
        },
      });

      const res = createMockResponse();

      await listOrdersHandler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.orders).toEqual([]);
      expect(response.pagination.total).toBe(0);
    });
  });
});
