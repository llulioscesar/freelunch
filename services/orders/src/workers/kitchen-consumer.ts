/**
 * Kitchen Events Consumer Worker
 *
 * This worker runs in the background to consume events from Kitchen Service.
 *
 * Deployment options:
 * 1. Long-running process (e.g., Docker container, PM2)
 * 2. Serverless cron job (e.g., Vercel Cron)
 * 3. Separate worker dyno (e.g., Heroku)
 *
 * For Vercel: This can be triggered by a cron endpoint every minute
 */
import { dependencies } from '../infrastructure/config/dependencies';
import { KitchenEventsConsumer } from '../infrastructure/consumers/KitchenEventsConsumer';
import { logger } from '../infrastructure/logging/Logger';

let consumer: KitchenEventsConsumer | null = null;

/**
 * Start the consumer
 */
export async function startConsumer(): Promise<void> {
  if (consumer) {
    logger.warn('Consumer already running');
    return;
  }

  try {
    consumer = new KitchenEventsConsumer(
      dependencies.updateOrderItemStatusUseCase
    );

    logger.info('Starting Kitchen Events Consumer...');

    await consumer.start();
  } catch (error) {
    logger.error('Failed to start consumer', error as Error);
    throw error;
  }
}

/**
 * Stop the consumer
 */
export function stopConsumer(): void {
  if (consumer) {
    consumer.stop();
    consumer = null;
    logger.info('Consumer stopped');
  }
}

/**
 * Process pending messages (for serverless cron)
 * This processes a batch of messages and returns
 */
export async function processBatch(): Promise<{ processed: number }> {
  const tempConsumer = new KitchenEventsConsumer(
    dependencies.updateOrderItemStatusUseCase,
    `batch-${Date.now()}`
  );

  try {
    await tempConsumer.initialize();

    // Process up to 10 messages
    const processed = 0;
    // TODO: Implement batch processing
    // For now, this is a placeholder

    logger.info('Batch processing completed', { processed });

    return { processed };
  } catch (error) {
    logger.error('Batch processing failed', error as Error);
    throw error;
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, stopping consumer...');
  stopConsumer();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, stopping consumer...');
  stopConsumer();
  process.exit(0);
});

// If running as main module, start the consumer
if (require.main === module) {
  logger.info('Kitchen Consumer Worker starting...');

  startConsumer().catch((error) => {
    logger.fatal('Consumer failed to start', error);
    process.exit(1);
  });
}
