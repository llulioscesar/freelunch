/**
 * API Endpoint: Plate Status History
 * GET /api/history?plateId=xxx or ?orderId=xxx
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../infrastructure/config/dependencies.js';
import { withCors } from '../../infrastructure/http/cors.js';
import { logger } from '../../infrastructure/logging/Logger.js';

async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    });
  }

  try {
    const { orderId, plateId } = req.query;

    if (!orderId && !plateId) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter orderId or plateId is required',
      });
    }

    const { statusHistoryRepository } = dependencies;

    if (!statusHistoryRepository) {
      return res.status(503).json({
        success: false,
        error: 'Status history not available',
      });
    }

    let history;

    if (plateId) {
      // Get history for specific plate
      history = await statusHistoryRepository.findByPlateId(plateId as string);
    } else {
      // Get history for all plates in order
      history = await statusHistoryRepository.findByOrderId(orderId as string);
    }

    logger.info('Plate status history retrieved', {
      orderId: orderId as string,
      plateId: plateId as string,
      count: history.length,
    });

    return res.status(200).json({
      success: true,
      history: history.map((entry) => ({
        id: entry.id,
        plateId: entry.plateId,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        changedAt: entry.changedAt.toISOString(),
        recipeId: entry.recipeId,
        recipeName: entry.recipeName,
        reason: entry.reason,
      })),
      count: history.length,
    });
  } catch (error: any) {
    logger.error('Failed to retrieve plate status history', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve plate status history',
    });
  }
}

export default withCors(handler);
