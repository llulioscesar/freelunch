/**
 * Tool executor - executes tools called by Gemini
 */
import {
  CreateOrderParams,
  RequestPurchaseParams,
  SearchOrdersParams,
  GetOrderDetailsParams,
  GetOrderHistoryParams,
  ToolResult,
} from './definitions';
import { getWarehouseStats } from '../clients/warehouse';
import { searchOrders, getOrderById, getOrderHistory } from '../clients/orders';

const ORDERS_URL = process.env.ORDERS_URL || 'http://localhost:3002';
const WAREHOUSE_URL = process.env.WAREHOUSE_URL || 'http://localhost:3001';

interface OrderResponse {
  order?: {
    id: string;
    status: string;
    quantity: number;
    customerName?: string;
  };
  error?: string;
}

interface PurchaseResponse {
  success: boolean;
  data?: {
    success: boolean;
    ingredientName: string;
    requestedQuantity: number;
    obtainedQuantity: number;
    newStockLevel: number;
    message: string;
  };
  error?: string;
}

export async function executeCreateOrder(params: CreateOrderParams): Promise<ToolResult> {
  try {
    const response = await fetch(`${ORDERS_URL}/api/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: params.quantity,
        customerName: params.customerName,
        notes: params.notes,
      }),
    });

    const data = (await response.json()) as OrderResponse;

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Error al crear la orden',
      };
    }

    return {
      success: true,
      data: {
        orderId: data.order?.id,
        status: data.order?.status,
        quantity: data.order?.quantity,
        customerName: data.order?.customerName,
        message: `Orden creada exitosamente con ${params.quantity} plato(s)`,
      },
    };
  } catch (error) {
    console.error('Error executing createOrder:', error);
    return {
      success: false,
      error: 'Error de conexion con el servicio de ordenes',
    };
  }
}

export async function executeRequestPurchase(params: RequestPurchaseParams): Promise<ToolResult> {
  try {
    const response = await fetch(`${WAREHOUSE_URL}/api/request-purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredientName: params.ingredientName,
        quantity: params.quantity,
      }),
    });

    const data = (await response.json()) as PurchaseResponse;

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.data?.message || 'Error al solicitar la compra',
      };
    }

    return {
      success: true,
      data: {
        ingredientName: data.data?.ingredientName,
        requestedQuantity: data.data?.requestedQuantity,
        obtainedQuantity: data.data?.obtainedQuantity,
        newStockLevel: data.data?.newStockLevel,
        message: data.data?.message,
      },
    };
  } catch (error) {
    console.error('Error executing requestPurchase:', error);
    return {
      success: false,
      error: 'Error de conexion con el servicio de almacen',
    };
  }
}

export async function executeGetAlerts(): Promise<ToolResult> {
  try {
    const stats = await getWarehouseStats();

    if (!stats) {
      return {
        success: false,
        error: 'No se pudieron obtener las estadisticas del almacen',
      };
    }

    const alerts: { type: string; urgency: string; ingredient: string; details: string }[] = [];

    // Out of stock alerts (high urgency)
    if (stats.inventory.outOfStock > 0) {
      stats.inventory.lowStockItems
        .filter((item) => item.quantity === 0)
        .forEach((item) => {
          alerts.push({
            type: 'out_of_stock',
            urgency: 'high',
            ingredient: item.ingredientName,
            details: 'Sin stock disponible',
          });
        });
    }

    // Low stock alerts (medium urgency)
    stats.inventory.lowStockItems
      .filter((item) => item.quantity > 0)
      .forEach((item) => {
        alerts.push({
          type: 'low_stock',
          urgency: 'medium',
          ingredient: item.ingredientName,
          details: `Stock bajo: ${item.quantity} unidades`,
        });
      });

    // Failed purchases alerts (high urgency)
    stats.failedPurchasesByIngredient
      .filter((item) => item.failedCount > 2)
      .forEach((item) => {
        alerts.push({
          type: 'purchase_failures',
          urgency: 'high',
          ingredient: item.ingredientName,
          details: `${item.failedCount} compras fallidas. Ultimo error: ${item.lastError || 'desconocido'}`,
        });
      });

    return {
      success: true,
      data: {
        totalAlerts: alerts.length,
        highUrgency: alerts.filter((a) => a.urgency === 'high').length,
        mediumUrgency: alerts.filter((a) => a.urgency === 'medium').length,
        alerts,
        summary: {
          outOfStock: stats.inventory.outOfStock,
          lowStock: stats.inventory.lowStock,
          totalIngredients: stats.inventory.total,
        },
      },
    };
  } catch (error) {
    console.error('Error executing getAlerts:', error);
    return {
      success: false,
      error: 'Error al obtener las alertas',
    };
  }
}

export async function executeSearchOrders(params: SearchOrdersParams): Promise<ToolResult> {
  try {
    const orders = await searchOrders(params);

    if (orders.length === 0) {
      return {
        success: true,
        data: {
          count: 0,
          orders: [],
          message: params.customerName
            ? `No se encontraron ordenes para "${params.customerName}"`
            : 'No se encontraron ordenes con los filtros especificados',
        },
      };
    }

    return {
      success: true,
      data: {
        count: orders.length,
        orders: orders.map((o) => ({
          id: o.id,
          status: o.status,
          customerName: o.customerName,
          quantity: o.quantity,
          createdAt: o.createdAt,
        })),
        message: `Se encontraron ${orders.length} orden(es)`,
      },
    };
  } catch (error) {
    console.error('Error executing searchOrders:', error);
    return {
      success: false,
      error: 'Error al buscar ordenes',
    };
  }
}

export async function executeGetOrderDetails(params: GetOrderDetailsParams): Promise<ToolResult> {
  try {
    const order = await getOrderById(params.orderId);

    if (!order) {
      return {
        success: false,
        error: `No se encontro la orden con ID "${params.orderId}"`,
      };
    }

    return {
      success: true,
      data: {
        id: order.id,
        status: order.status,
        customerName: order.customerName,
        quantity: order.quantity,
        progress: order.progress,
        items: order.items?.map((item) => ({
          id: item.id,
          status: item.status,
          recipeName: item.recipeName || 'Sin receta',
          failureReason: item.failureReason,
        })),
        createdAt: order.createdAt,
      },
    };
  } catch (error) {
    console.error('Error executing getOrderDetails:', error);
    return {
      success: false,
      error: 'Error al obtener detalles de la orden',
    };
  }
}

export async function executeGetOrderHistory(params: GetOrderHistoryParams): Promise<ToolResult> {
  try {
    const history = await getOrderHistory(params.orderId);

    if (history.length === 0) {
      return {
        success: true,
        data: {
          count: 0,
          history: [],
          message: 'No hay historial de cambios para esta orden',
        },
      };
    }

    return {
      success: true,
      data: {
        count: history.length,
        history: history.map((entry) => ({
          fromStatus: entry.fromStatus,
          toStatus: entry.toStatus,
          changedAt: entry.changedAt,
          recipeName: entry.recipeName,
          reason: entry.reason,
        })),
        message: `La orden tiene ${history.length} cambio(s) de estado`,
      },
    };
  } catch (error) {
    console.error('Error executing getOrderHistory:', error);
    return {
      success: false,
      error: 'Error al obtener historial de la orden',
    };
  }
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case 'createOrder': {
      const orderParams: CreateOrderParams = {
        quantity: typeof args.quantity === 'number' ? args.quantity : 1,
        customerName: typeof args.customerName === 'string' ? args.customerName : undefined,
        notes: typeof args.notes === 'string' ? args.notes : undefined,
      };
      return executeCreateOrder(orderParams);
    }
    case 'requestPurchase': {
      const purchaseParams: RequestPurchaseParams = {
        ingredientName: typeof args.ingredientName === 'string' ? args.ingredientName : '',
        quantity: typeof args.quantity === 'number' ? args.quantity : 10,
      };
      return executeRequestPurchase(purchaseParams);
    }
    case 'getAlerts': {
      return executeGetAlerts();
    }
    case 'searchOrders': {
      const searchParams: SearchOrdersParams = {
        customerName: typeof args.customerName === 'string' ? args.customerName : undefined,
        status: typeof args.status === 'string' ? args.status : undefined,
        limit: typeof args.limit === 'number' ? args.limit : 10,
      };
      return executeSearchOrders(searchParams);
    }
    case 'getOrderDetails': {
      const detailsParams: GetOrderDetailsParams = {
        orderId: typeof args.orderId === 'string' ? args.orderId : '',
      };
      return executeGetOrderDetails(detailsParams);
    }
    case 'getOrderHistory': {
      const historyParams: GetOrderHistoryParams = {
        orderId: typeof args.orderId === 'string' ? args.orderId : '',
      };
      return executeGetOrderHistory(historyParams);
    }
    default:
      return {
        success: false,
        error: `Herramienta desconocida: ${name}`,
      };
  }
}
