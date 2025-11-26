/**
 * API Endpoint: Request Purchase
 * Allows AI assistant to request direct purchases of ingredients
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { dependencies } from '../../infrastructure/config/dependencies.js';
import { withCors } from '../../infrastructure/http/cors.js';
import { logger } from '../../infrastructure/logging/Logger.js';

// Request validation schema
const requestPurchaseSchema = z.object({
  ingredientName: z.string().min(1),
  quantity: z.number().min(1).max(100),
});

async function requestPurchaseHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Validate request body
    const body = requestPurchaseSchema.parse(req.body);

    logger.info('Request purchase received', {
      ingredientName: body.ingredientName,
      quantity: body.quantity,
    });

    // Execute use case
    const result = await dependencies.requestPurchaseUseCase.execute({
      ingredientName: body.ingredientName,
      quantity: body.quantity,
    });

    logger.info('Request purchase completed', {
      ingredientName: body.ingredientName,
      success: result.success,
      obtainedQuantity: result.obtainedQuantity,
    });

    // Return response
    return res.status(result.success ? 200 : 422).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error', {
        errors: error.issues,
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.issues,
      });
    }

    if (error instanceof Error) {
      logger.error('Request purchase failed', error);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('Unknown error in request purchase', error as Error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// Export handler wrapped with CORS middleware
export default withCors(requestPurchaseHandler);
