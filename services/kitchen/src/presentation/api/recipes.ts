/**
 * API Endpoint: Get Recipes
 * Presentation layer for listing available recipes
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../infrastructure/config/dependencies';
import { withMetrics } from '../../infrastructure/metrics/MetricsMiddleware';
import { withCors } from '../../infrastructure/http/cors';
import { logger } from '../../infrastructure/logging/Logger';

async function getRecipesHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.debug('Fetching recipes');

    // Execute use case
    const result = await dependencies.getRecipesUseCase.execute();

    logger.info('Recipes fetched successfully', {
      count: result.recipes.length,
    });

    // Return response
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch recipes', error);

      return res.status(400).json({
        error: error.message,
      });
    }

    logger.error('Unknown error in get recipes', error as Error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recipes',
    });
  }
}

// Export handler wrapped with CORS and metrics middleware
export default withCors(withMetrics(getRecipesHandler));
