/**
 * API Endpoint: Create Order
 * Presentation layer for creating orders
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { dependencies } from '../../infrastructure/config/dependencies';
import { withLogging } from '../../infrastructure/logging/RequestLogger';
import { logger } from '../../infrastructure/logging/Logger';

// Request validation schema
const createOrderSchema = z.object({
  quantity: z.number().min(1).max(100),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

async function createOrderHandler(
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

    logger.debug('Creating order', {
      quantity: body.quantity,
      customerName: body.customerName,
    });

    // Execute use case
    const result = await dependencies.createOrderUseCase.execute({
      quantity: body.quantity,
      customerName: body.customerName,
      notes: body.notes,
    });

    logger.info('Order created successfully', {
      orderId: result.order?.id,
      quantity: body.quantity,
    });

    // Return response
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error', {
        errors: error.errors,
      });

      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      logger.error('Order creation failed', error);

      return res.status(400).json({
        error: error.message,
      });
    }

    logger.error('Unknown error in create order', error as Error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create order',
    });
  }
}

// Export handler wrapped with logging middleware
export default withLogging(createOrderHandler);