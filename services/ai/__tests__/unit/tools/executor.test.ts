import { executeCreateOrder, executeTool } from '../../../src/tools/executor';

// Mock global fetch
global.fetch = jest.fn();

describe('Tool Executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCreateOrder', () => {
    it('should create order successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'pending',
        quantity: 5,
        customerName: 'Juan',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ order: mockOrder }),
      });

      const result = await executeCreateOrder({
        quantity: 5,
        customerName: 'Juan',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        orderId: 'order-123',
        status: 'pending',
        quantity: 5,
        customerName: 'Juan',
      }));
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/create'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Invalid quantity' }),
      });

      const result = await executeCreateOrder({ quantity: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid quantity');
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await executeCreateOrder({ quantity: 5 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error de conexion con el servicio de ordenes');
      consoleSpy.mockRestore();
    });
  });

  describe('executeTool', () => {
    it('should execute createOrder tool', async () => {
      const mockOrder = {
        id: 'order-456',
        status: 'pending',
        quantity: 3,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ order: mockOrder }),
      });

      const result = await executeTool('createOrder', { quantity: 3 });

      expect(result.success).toBe(true);
    });

    it('should return error for unknown tool', async () => {
      const result = await executeTool('unknownTool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Herramienta desconocida: unknownTool');
    });

    it('should handle non-number quantity by defaulting to 1', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ order: { id: 'test', status: 'pending', quantity: 1 } }),
      });

      await executeTool('createOrder', { quantity: 'not a number' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"quantity":1'),
        })
      );
    });
  });
});
