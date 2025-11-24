/**
 * Plates Endpoint
 * Kitchen Service - Vercel Serverless Function
 *
 * GET /api/plates - Returns plates (optionally filtered by status or orderId)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../src/infrastructure/config/dependencies.js';
import { PlateStatusEnum } from '../../src/domain/value-objects/PlateStatus.js';
import { logger } from '../../src/infrastructure/logging/Logger.js';
import { withMetrics } from '../../src/infrastructure/metrics/MetricsMiddleware.js';

async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { status, orderId, includeStats } = req.query;

    logger.info('List plates requested', {
      status,
      orderId,
      includeStats,
    });

    // Get use case from DI container
    const { listPlatesUseCase } = dependencies;

    // Execute use case
    const result = await listPlatesUseCase.execute({
      status: status as PlateStatusEnum | undefined,
      orderId: orderId as string | undefined,
      includeStats: includeStats === 'true',
    });

    const duration = Date.now() - startTime;

    logger.info('List plates completed', {
      count: result.total,
      durationMs: duration,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('List plates failed', error, {
      durationMs: duration,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export default withMetrics(handler);
