/**
 * Recipes Endpoint
 * Kitchen Service - Vercel Serverless Function
 *
 * GET /api/recipes - Returns all available recipes
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../src/infrastructure/config/dependencies.js';
import { logger } from '../../src/infrastructure/logging/Logger.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    logger.info('Get recipes requested');

    // Get use case from DI container
    const { getRecipesUseCase } = dependencies;

    // Execute use case
    const result = await getRecipesUseCase.execute();

    const duration = Date.now() - startTime;

    logger.info('Get recipes completed', {
      count: result.total,
      durationMs: duration,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Get recipes failed', error, {
      durationMs: duration,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
