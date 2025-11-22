/**
 * API Endpoint: Create Order
 * Presentation layer for creating orders
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { dependencies } from '../../infrastructure/config/dependencies';

// Request validation schema
const createOrderSchema = z.object({
  quantity: z.number().min(1).max(100),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const body = createOrderSchema.parse(req.body);

    // Execute use case
    const result = await dependencies.createOrderUseCase.execute({
      quantity: body.quantity,
      customerName: body.customerName,
      notes: body.notes,
    });

    // Return response
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in create order endpoint:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create order',
    });
  }
}