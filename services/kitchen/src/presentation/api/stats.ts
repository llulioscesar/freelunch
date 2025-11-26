/**
 * API Endpoint: Kitchen Stats
 * Presentation layer for kitchen statistics
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../infrastructure/config/dependencies.js';
import { withMetrics } from '../../infrastructure/metrics/MetricsMiddleware.js';
import { withCors } from '../../infrastructure/http/cors.js';
import { logger } from '../../infrastructure/logging/Logger.js';

async function statsHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    logger.debug('Fetching kitchen stats');

    // Execute use case
    const result = await dependencies.getKitchenStatsUseCase.execute();

    logger.info('Kitchen stats fetched successfully');

    // Return response
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch kitchen stats', error);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('Unknown error in kitchen stats', error as Error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// Export handler wrapped with CORS and metrics middleware
export default withCors(withMetrics(statsHandler));
