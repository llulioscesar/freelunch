import { executeCreateOrder, executeRequestPurchase, executeGetAlerts, executeTool } from '../../../src/tools/executor';

// Mock global fetch
global.fetch = jest.fn();

// Mock warehouse client
jest.mock('../../../src/clients/warehouse', () => ({
  getWarehouseStats: jest.fn(),
}));

import { getWarehouseStats } from '../../../src/clients/warehouse';

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

  describe('executeRequestPurchase', () => {
    it('should request purchase successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            success: true,
            ingredientName: 'tomato',
            requestedQuantity: 20,
            obtainedQuantity: 20,
            newStockLevel: 25,
            message: 'Compra exitosa: 20 unidades de tomato',
          },
        }),
      });

      const result = await executeRequestPurchase({
        ingredientName: 'tomato',
        quantity: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        ingredientName: 'tomato',
        obtainedQuantity: 20,
        newStockLevel: 25,
      }));
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/request-purchase'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle purchase failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          data: {
            success: false,
            message: 'No se pudo obtener tomato del mercado',
          },
        }),
      });

      const result = await executeRequestPurchase({
        ingredientName: 'tomato',
        quantity: 20,
      });

      expect(result.success).toBe(false);
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await executeRequestPurchase({
        ingredientName: 'tomato',
        quantity: 20,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error de conexion con el servicio de almacen');
      consoleSpy.mockRestore();
    });
  });

  describe('executeGetAlerts', () => {
    it('should return alerts from warehouse stats', async () => {
      (getWarehouseStats as jest.Mock).mockResolvedValue({
        inventory: {
          total: 10,
          outOfStock: 1,
          lowStock: 2,
          lowStockItems: [
            { ingredientName: 'tomato', quantity: 0 },
            { ingredientName: 'cheese', quantity: 3 },
          ],
        },
        failedPurchasesByIngredient: [
          { ingredientName: 'onion', failedCount: 5, lastError: 'Market closed' },
        ],
      });

      const result = await executeGetAlerts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        totalAlerts: 3,
        highUrgency: 2, // tomato out of stock + onion failed purchases
        mediumUrgency: 1, // cheese low stock
      }));
    });

    it('should return error when warehouse stats fail', async () => {
      (getWarehouseStats as jest.Mock).mockResolvedValue(null);

      const result = await executeGetAlerts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudieron obtener las estadisticas del almacen');
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

    it('should execute requestPurchase tool', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            success: true,
            ingredientName: 'tomato',
            obtainedQuantity: 10,
          },
        }),
      });

      const result = await executeTool('requestPurchase', {
        ingredientName: 'tomato',
        quantity: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should execute getAlerts tool', async () => {
      (getWarehouseStats as jest.Mock).mockResolvedValue({
        inventory: {
          total: 5,
          outOfStock: 0,
          lowStock: 0,
          lowStockItems: [],
        },
        failedPurchasesByIngredient: [],
      });

      const result = await executeTool('getAlerts', {});

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
