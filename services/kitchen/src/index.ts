/**
 * Kitchen Service Entry Point
 *
 * Initializes and starts event consumers for:
 * - Order events (from Orders service)
 * - Warehouse responses (from Warehouse service)
 *
 * This is used for running consumers in long-running mode (non-serverless).
 * For Vercel serverless deployment, consumers are triggered by cron jobs.
 */
import { dependencies } from './infrastructure/config/dependencies';
import { OrderEventsConsumer } from './infrastructure/consumers/OrderEventsConsumer';
import { WarehouseResponsesConsumer } from './infrastructure/consumers/WarehouseResponsesConsumer';
import { logger } from './infrastructure/logging/Logger';

async function main() {
  logger.info('🍳 Kitchen Service starting...');

  try {
    // Initialize consumers
    const orderEventsConsumer = new OrderEventsConsumer(
      dependencies.processOrderUseCase,
      dependencies.assignRecipeUseCase
    );

    const warehouseResponsesConsumer = new WarehouseResponsesConsumer(
      dependencies.plateRepository,
      dependencies.eventPublisher
    );

    // Initialize consumer groups
    logger.info('Initializing consumer groups...');
    await orderEventsConsumer.initialize();
    await warehouseResponsesConsumer.initialize();

    // Start consumers
    logger.info('Starting event consumers...');
    await Promise.all([
      orderEventsConsumer.start(),
      warehouseResponsesConsumer.start(),
    ]);

    logger.info('✅ Kitchen Service is running');

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('🛑 Shutting down Kitchen Service...');

      await orderEventsConsumer.stop();
      await warehouseResponsesConsumer.stop();

      logger.info('👋 Kitchen Service stopped');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('❌ Failed to start Kitchen Service', error as Error);
    process.exit(1);
  }
}

main();
