/**
 * API Endpoint: Kitchen Events Worker Trigger
 *
 * This endpoint is called by an external cron service (e.g., cron-job.org)
 * to process Kitchen events every minute.
 *
 * Configuration:
 * - URL: https://your-vercel-url.vercel.app/api/workers/kitchen-events
 * - Method: GET or POST
 * - Schedule: Every 1 minute
 * - Service: cron-job.org (free tier supports up to 50 jobs, 1-minute intervals)
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../src/infrastructure/config/dependencies';
import { KitchenEventsConsumer } from '../../src/infrastructure/consumers/KitchenEventsConsumer';
import { logger } from '../../src/infrastructure/logging/Logger';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST (from cron) or GET (for manual trigger)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    logger.info('Kitchen events worker triggered', {
      method: req.method,
      headers: req.headers,
    });

    // Create consumer instance
    const consumer = new KitchenEventsConsumer(
      dependencies.updateOrderItemStatusUseCase,
      `worker-${Date.now()}`
    );

    await consumer.initialize();

    // Process pending messages
    const pending = await consumer.getPendingMessages();
    logger.info('Pending messages found', {
      count: pending?.length || 0,
    });

    // Claim stale messages (fault tolerance)
    await consumer.claimStaleMessages();

    const duration = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      processed: pending?.length || 0,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Worker execution failed', error);

    return res.status(500).json({
      error: 'Worker execution failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
