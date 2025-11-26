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

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
