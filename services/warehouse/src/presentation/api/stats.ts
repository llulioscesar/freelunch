/**
 * API Endpoint: Warehouse Stats
 * Presentation layer for warehouse statistics
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../infrastructure/config/dependencies.js';
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
    logger.debug('Fetching warehouse stats');

    // Execute use case
    const result = await dependencies.getWarehouseStatsUseCase.execute();

    logger.info('Warehouse stats fetched successfully');

    // Return response
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch warehouse stats', error);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('Unknown error in warehouse stats', error as Error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// Export handler wrapped with CORS middleware
export default withCors(statsHandler);
