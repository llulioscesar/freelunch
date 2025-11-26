/**
 * Tool executor - executes tools called by Gemini
 */
import { CreateOrderParams, ToolResult } from './definitions';

const ORDERS_URL = process.env.ORDERS_URL || 'http://localhost:3002';

interface OrderResponse {
  order?: {
    id: string;
    status: string;
    quantity: number;
    customerName?: string;
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
    default:
      return {
        success: false,
        error: `Herramienta desconocida: ${name}`,
      };
  }
}
