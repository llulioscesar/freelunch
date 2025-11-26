/**
 * API Endpoint: List Plates
 * Presentation layer for listing plates
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { dependencies } from '../../infrastructure/config/dependencies';
import { withMetrics } from '../../infrastructure/metrics/MetricsMiddleware';
import { withCors } from '../../infrastructure/http/cors';
import { logger } from '../../infrastructure/logging/Logger';
import { PlateStatusEnum } from '../../domain/value-objects/PlateStatus';

// Query parameters validation schema
const listPlatesSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'REQUESTING_INGREDIENTS', 'COOKING', 'READY', 'FAILED']).optional(),
  orderId: z.string().optional(),
});

async function listPlatesHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate query parameters
    const query = listPlatesSchema.parse(req.query);

    logger.debug('Fetching plates', {
      status: query.status,
      orderId: query.orderId,
    });

    // Execute use case
    const result = await dependencies.listPlatesUseCase.execute({
      status: query.status as PlateStatusEnum | undefined,
      orderId: query.orderId,
    });

    logger.info('Plates fetched successfully', {
      count: result.plates.length,
    });

    // Return response
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error', {
        errors: (error as any).errors,
      });

      return res.status(400).json({
        error: 'Invalid request',
        details: (error as any).errors,
      });
    }

    if (error instanceof Error) {
      logger.error('Failed to fetch plates', error);

      return res.status(400).json({
        error: error.message,
      });
    }

    logger.error('Unknown error in list plates', error as Error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch plates',
    });
  }
}

// Export handler wrapped with CORS and metrics middleware
export default withCors(withMetrics(listPlatesHandler));
