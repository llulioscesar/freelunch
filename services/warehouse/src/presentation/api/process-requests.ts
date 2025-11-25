/**
 * API Endpoint: Process Kitchen Requests
 * Worker endpoint for processing ingredient requests from kitchen (serverless cron)
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { ProcessIngredientRequestUseCase } from '../../application/use-cases/ProcessIngredientRequestUseCase.js';
import { KitchenRequestsConsumer } from '../../infrastructure/consumers/KitchenRequestsConsumer.js';
import { PrismaInventoryRepository } from '../../infrastructure/adapters/persistence/PrismaInventoryRepository.js';
import { PrismaPurchaseRepository } from '../../infrastructure/adapters/persistence/PrismaPurchaseRepository.js';
import { HttpMarketClient } from '../../infrastructure/adapters/http/HttpMarketClient.js';
import { RedisKitchenClient } from '../../infrastructure/adapters/messaging/RedisKitchenClient.js';
import { logger } from '../../infrastructure/logging/Logger.js';

let consumer: KitchenRequestsConsumer | null = null;
let isInitialized = false;

async function getConsumer(): Promise<KitchenRequestsConsumer> {
  if (!consumer) {
    const inventoryRepository = new PrismaInventoryRepository();
    const purchaseRepository = new PrismaPurchaseRepository();
    const marketClient = new HttpMarketClient();
    const kitchenClient = new RedisKitchenClient();

    const processIngredientRequestUseCase = new ProcessIngredientRequestUseCase(
      inventoryRepository,
      purchaseRepository,
      marketClient,
      kitchenClient
    );

    consumer = new KitchenRequestsConsumer(processIngredientRequestUseCase);
  }

  if (!isInitialized) {
    await consumer.initialize();
    isInitialized = true;
  }

  return consumer;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST to trigger processing.',
    });
  }

  const startTime = Date.now();

  try {
    const kitchenConsumer = await getConsumer();

    // Process batch of messages
    const maxMessages = req.body?.maxMessages || 10;
    const processedCount = await kitchenConsumer.processBatch(maxMessages);

    const duration = Date.now() - startTime;

    logger.info('Process requests completed', {
      processedCount,
      duration,
      maxMessages,
    });

    return res.status(200).json({
      success: true,
      processedCount,
      duration,
      message: `Processed ${processedCount} ingredient requests`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Process requests failed', error, { duration });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process requests',
      duration,
    });
  }
}
