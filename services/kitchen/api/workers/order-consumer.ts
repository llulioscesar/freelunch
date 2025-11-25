/**
 * Worker: Order Consumer
 * Kitchen Service - Vercel Serverless Function
 *
 * Triggered by QStash cron to process events from Orders service
 * Processes OrderCreated events from stream:orders:events
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../dist/infrastructure/config/dependencies.js';
import { logger } from '../../dist/infrastructure/logging/Logger.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    logger.info('Order consumer worker triggered', {
      method: req.method,
      headers: req.headers,
    });

    // Get consumer from DI container
    const { orderEventsConsumer } = dependencies;

    // Initialize consumer group (idempotent)
    await orderEventsConsumer.initialize();

    // Process batch of messages (serverless-friendly)
    const batchSize = parseInt(process.env.ORDER_CONSUMER_BATCH_SIZE || '50', 10);
    const processedCount = await orderEventsConsumer.processBatch(batchSize);

    const duration = Date.now() - startTime;

    logger.info('Order consumer worker completed', {
      processedCount,
      durationMs: duration,
    });

    return res.status(200).json({
      success: true,
      processedCount,
      durationMs: duration,
      message: `Processed ${processedCount} order events`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Order consumer worker failed', error, {
      durationMs: duration,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration,
    });
  }
}
