/**
 * Worker: Warehouse Consumer
 * Kitchen Service - Vercel Serverless Function
 *
 * Triggered by QStash cron to process responses from Warehouse service
 * Processes ingredient availability responses from stream:warehouse:responses
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../src/infrastructure/config/dependencies.js';
import { logger } from '../../src/infrastructure/logging/Logger.js';

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
    logger.info('Warehouse consumer worker triggered', {
      method: req.method,
      headers: req.headers,
    });

    // Get consumer from DI container
    const { warehouseResponsesConsumer } = dependencies;

    // Initialize consumer group (idempotent)
    await warehouseResponsesConsumer.initialize();

    // Process batch of messages (serverless-friendly)
    const processedCount = await warehouseResponsesConsumer.processBatch(10);

    const duration = Date.now() - startTime;

    logger.info('Warehouse consumer worker completed', {
      processedCount,
      durationMs: duration,
    });

    return res.status(200).json({
      success: true,
      processedCount,
      durationMs: duration,
      message: `Processed ${processedCount} warehouse responses`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Warehouse consumer worker failed', error, {
      durationMs: duration,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration,
    });
  }
}
