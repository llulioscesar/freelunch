import {
  executeCreateOrder,
  executeRequestPurchase,
  executeGetAlerts,
  executeSearchOrders,
  executeGetOrderDetails,
  executeGetOrderHistory,
  executeTool,
} from '../../../src/tools/executor';

// Mock global fetch
global.fetch = jest.fn();

// Mock warehouse client
jest.mock('../../../src/clients/warehouse', () => ({
  getWarehouseStats: jest.fn(),
}));

// Mock orders client
jest.mock('../../../src/clients/orders', () => ({
  searchOrders: jest.fn(),
  getOrderById: jest.fn(),
  getOrderHistory: jest.fn(),
}));

import { getWarehouseStats } from '../../../src/clients/warehouse';
import { searchOrders, getOrderById, getOrderHistory } from '../../../src/clients/orders';

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

  describe('executeSearchOrders', () => {
    it('should return orders matching search criteria', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'active', customerName: 'Juan', quantity: 2, createdAt: '2024-01-01' },
        { id: 'order-2', status: 'completed', customerName: 'Juan', quantity: 3, createdAt: '2024-01-02' },
      ];

      (searchOrders as jest.Mock).mockResolvedValue(mockOrders);

      const result = await executeSearchOrders({ customerName: 'Juan' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        count: 2,
        orders: expect.arrayContaining([
          expect.objectContaining({ id: 'order-1', customerName: 'Juan' }),
        ]),
      }));
    });

    it('should return empty result when no orders found', async () => {
      (searchOrders as jest.Mock).mockResolvedValue([]);

      const result = await executeSearchOrders({ customerName: 'Unknown' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        count: 0,
        orders: [],
      }));
    });

    it('should handle error', async () => {
      (searchOrders as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await executeSearchOrders({ customerName: 'Juan' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al buscar ordenes');
      consoleSpy.mockRestore();
    });
  });

  describe('executeGetOrderDetails', () => {
    it('should return order details', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'active',
        customerName: 'Juan',
        quantity: 3,
        progress: 66,
        items: [
          { id: 'item-1', status: 'ready', recipeName: 'Pizza' },
          { id: 'item-2', status: 'preparing', recipeName: 'Pasta' },
          { id: 'item-3', status: 'failed', recipeName: 'Soup', failureReason: 'Missing ingredient' },
        ],
        createdAt: '2024-01-01',
      };

      (getOrderById as jest.Mock).mockResolvedValue(mockOrder);

      const result = await executeGetOrderDetails({ orderId: 'order-123' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: 'order-123',
        status: 'active',
        progress: 66,
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'item-1', status: 'ready' }),
          expect.objectContaining({ failureReason: 'Missing ingredient' }),
        ]),
      }));
    });

    it('should return error when order not found', async () => {
      (getOrderById as jest.Mock).mockResolvedValue(null);

      const result = await executeGetOrderDetails({ orderId: 'invalid-id' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No se encontro la orden');
    });

    it('should handle error', async () => {
      (getOrderById as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await executeGetOrderDetails({ orderId: 'order-123' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al obtener detalles de la orden');
      consoleSpy.mockRestore();
    });
  });

  describe('executeGetOrderHistory', () => {
    it('should return order history', async () => {
      const mockHistory = [
        { fromStatus: 'pending', toStatus: 'preparing', changedAt: '2024-01-01T10:00:00Z', recipeName: 'Pizza' },
        { fromStatus: 'preparing', toStatus: 'ready', changedAt: '2024-01-01T10:30:00Z', recipeName: 'Pizza' },
      ];

      (getOrderHistory as jest.Mock).mockResolvedValue(mockHistory);

      const result = await executeGetOrderHistory({ orderId: 'order-123' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        count: 2,
        history: expect.arrayContaining([
          expect.objectContaining({ fromStatus: 'pending', toStatus: 'preparing' }),
        ]),
      }));
    });

    it('should return empty result when no history', async () => {
      (getOrderHistory as jest.Mock).mockResolvedValue([]);

      const result = await executeGetOrderHistory({ orderId: 'order-123' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        count: 0,
        history: [],
      }));
    });

    it('should handle error', async () => {
      (getOrderHistory as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await executeGetOrderHistory({ orderId: 'order-123' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al obtener historial de la orden');
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

    it('should execute searchOrders tool', async () => {
      (searchOrders as jest.Mock).mockResolvedValue([
        { id: 'order-1', customerName: 'Juan' },
      ]);

      const result = await executeTool('searchOrders', { customerName: 'Juan' });

      expect(result.success).toBe(true);
      expect(searchOrders).toHaveBeenCalledWith(expect.objectContaining({ customerName: 'Juan' }));
    });

    it('should execute getOrderDetails tool', async () => {
      (getOrderById as jest.Mock).mockResolvedValue({
        id: 'order-123',
        status: 'active',
      });

      const result = await executeTool('getOrderDetails', { orderId: 'order-123' });

      expect(result.success).toBe(true);
      expect(getOrderById).toHaveBeenCalledWith('order-123');
    });

    it('should execute getOrderHistory tool', async () => {
      (getOrderHistory as jest.Mock).mockResolvedValue([
        { fromStatus: 'pending', toStatus: 'preparing' },
      ]);

      const result = await executeTool('getOrderHistory', { orderId: 'order-123' });

      expect(result.success).toBe(true);
      expect(getOrderHistory).toHaveBeenCalledWith('order-123');
    });
  });
});
