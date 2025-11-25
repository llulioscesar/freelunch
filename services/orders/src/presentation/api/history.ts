/**
 * API Endpoint: Order Item Status History
 * GET /api/history?orderId=xxx or ?itemId=xxx
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../infrastructure/config/dependencies';
import { logger } from '../../infrastructure/logging/Logger';

export default async function handler(
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
    const { orderId, itemId } = req.query;

    if (!orderId && !itemId) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter orderId or itemId is required',
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

    if (itemId) {
      // Get history for specific item
      history = await statusHistoryRepository.findByOrderItemId(itemId as string);
    } else {
      // Get history for all items in order
      history = await statusHistoryRepository.findByOrderId(orderId as string);
    }

    logger.info('Status history retrieved', {
      orderId: orderId as string,
      itemId: itemId as string,
      count: history.length,
    });

    return res.status(200).json({
      success: true,
      history: history.map((entry) => ({
        id: entry.id,
        orderItemId: entry.orderItemId,
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
    logger.error('Failed to retrieve status history', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve status history',
    });
  }
}
