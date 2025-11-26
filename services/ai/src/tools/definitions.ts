/**
 * Tool definitions for Gemini function calling
 */
import { SchemaType } from '@google/generative-ai';

export const toolDefinitions = [
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
];

export interface CreateOrderParams {
  quantity: number;
  customerName?: string;
  notes?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
