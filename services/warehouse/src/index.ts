/**
 * Warehouse Service Entry Point
 *
 * Initializes and starts event consumers for:
 * - Kitchen requests (ingredient requests from Kitchen service)
 *
 * This is used for running consumers in long-running mode (non-serverless).
 * For Vercel serverless deployment, consumers are triggered by cron jobs.
 */
import { ProcessIngredientRequestUseCase } from './application/use-cases/ProcessIngredientRequestUseCase';
import { InitializeInventoryUseCase } from './application/use-cases/InitializeInventoryUseCase';
import { KitchenRequestsConsumer } from './infrastructure/consumers/KitchenRequestsConsumer';
import { PrismaInventoryRepository } from './infrastructure/adapters/persistence/PrismaInventoryRepository';
import { PrismaPurchaseRepository } from './infrastructure/adapters/persistence/PrismaPurchaseRepository';
import { HttpMarketClient } from './infrastructure/adapters/http/HttpMarketClient';
import { RedisKitchenClient } from './infrastructure/adapters/messaging/RedisKitchenClient';
import { logger } from './infrastructure/logging/Logger';

async function main() {
  logger.info('Warehouse Service starting...');

  try {
    // Initialize repositories
    const inventoryRepository = new PrismaInventoryRepository();
    const purchaseRepository = new PrismaPurchaseRepository();

    // Initialize external clients
    const marketClient = new HttpMarketClient();
    const kitchenClient = new RedisKitchenClient();

    // Initialize use cases
    const processIngredientRequestUseCase = new ProcessIngredientRequestUseCase(
      inventoryRepository,
      purchaseRepository,
      marketClient,
      kitchenClient
    );

    const initializeInventoryUseCase = new InitializeInventoryUseCase(
      inventoryRepository
    );

    // Initialize inventory with default stock if needed
    logger.info('Initializing inventory...');
    await initializeInventoryUseCase.execute();

    // Initialize consumer
    const kitchenRequestsConsumer = new KitchenRequestsConsumer(
      processIngredientRequestUseCase
    );

    // Initialize consumer group
    logger.info('Initializing consumer groups...');
    await kitchenRequestsConsumer.initialize();

    // Start consumer
    logger.info('Starting event consumers...');
    await kitchenRequestsConsumer.start();

    logger.info('Warehouse Service is running');

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down Warehouse Service...');

      await kitchenRequestsConsumer.stop();

      logger.info('Warehouse Service stopped');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start Warehouse Service', error as Error);
    process.exit(1);
  }
}

main();
