/**
 * Tool definitions for Gemini function calling
 */
import { SchemaType, FunctionDeclaration } from '@google/generative-ai';

export const toolDefinitions: FunctionDeclaration[] = [
  {
    name: 'createOrder',
    description: 'Crea una nueva orden de comida para un cliente. Usa esta herramienta cuando el usuario quiera crear una orden, pedir comida, o solicitar platos.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        quantity: {
          type: SchemaType.NUMBER,
          description: 'Cantidad de platos a preparar (1-100)',
        },
        customerName: {
          type: SchemaType.STRING,
          description: 'Nombre del cliente (opcional)',
        },
        notes: {
          type: SchemaType.STRING,
          description: 'Notas adicionales para la orden (opcional)',
        },
      },
      required: ['quantity'],
    },
  },
  {
    name: 'requestPurchase',
    description: 'Solicita la compra de un ingrediente al mercado. Usa esta herramienta para resolver alertas de stock bajo o sin stock.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ingredientName: {
          type: SchemaType.STRING,
          description: 'Nombre del ingrediente a comprar',
        },
        quantity: {
          type: SchemaType.NUMBER,
          description: 'Cantidad a comprar (1-100)',
        },
      },
      required: ['ingredientName', 'quantity'],
    },
  },
  {
    name: 'getAlerts',
    description: 'Obtiene las alertas criticas actuales del sistema (ingredientes sin stock, stock bajo, compras fallidas). Usa esta herramienta cuando necesites ver las alertas actualizadas.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'searchOrders',
    description: 'Busca ordenes por nombre de cliente o estado. Usa esta herramienta para encontrar ordenes de un cliente especifico o listar ordenes por estado.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        customerName: {
          type: SchemaType.STRING,
          description: 'Nombre del cliente a buscar (busqueda parcial)',
        },
        status: {
          type: SchemaType.STRING,
          description: 'Estado de la orden: active, completed, failed, cancelled',
        },
        limit: {
          type: SchemaType.NUMBER,
          description: 'Cantidad maxima de resultados (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'getOrderDetails',
    description: 'Obtiene los detalles completos de una orden por su ID, incluyendo items y progreso. Usa esta herramienta cuando necesites informacion detallada de una orden especifica.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        orderId: {
          type: SchemaType.STRING,
          description: 'ID de la orden (puede ser el ID completo o parcial)',
        },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'getOrderHistory',
    description: 'Obtiene el historial de cambios de estado de una orden. Usa esta herramienta para ver la linea de tiempo de una orden.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        orderId: {
          type: SchemaType.STRING,
          description: 'ID de la orden',
        },
      },
      required: ['orderId'],
    },
  },
];

export interface CreateOrderParams {
  quantity: number;
  customerName?: string;
  notes?: string;
}

export interface RequestPurchaseParams {
  ingredientName: string;
  quantity: number;
}

export interface SearchOrdersParams {
  customerName?: string;
  status?: string;
  limit?: number;
}

export interface GetOrderDetailsParams {
  orderId: string;
}

export interface GetOrderHistoryParams {
  orderId: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
