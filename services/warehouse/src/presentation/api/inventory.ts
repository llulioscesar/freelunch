/**
 * API Endpoint: Inventory
 * Get inventory status
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GetInventoryUseCase } from '../../application/use-cases/GetInventoryUseCase.js';
import { InitializeInventoryUseCase } from '../../application/use-cases/InitializeInventoryUseCase.js';
import { PrismaInventoryRepository } from '../../infrastructure/adapters/persistence/PrismaInventoryRepository.js';
import { withCors } from '../../infrastructure/http/cors.js';
import { logger } from '../../infrastructure/logging/Logger.js';

let inventoryRepository: PrismaInventoryRepository | null = null;
let getInventoryUseCase: GetInventoryUseCase | null = null;
let initializeInventoryUseCase: InitializeInventoryUseCase | null = null;

function getUseCases() {
  if (!inventoryRepository) {
    inventoryRepository = new PrismaInventoryRepository();
  }
  if (!getInventoryUseCase) {
    getInventoryUseCase = new GetInventoryUseCase(inventoryRepository);
  }
  if (!initializeInventoryUseCase) {
    initializeInventoryUseCase = new InitializeInventoryUseCase(inventoryRepository);
  }
  return { getInventoryUseCase, initializeInventoryUseCase };
}

async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { getInventoryUseCase, initializeInventoryUseCase } = getUseCases();

  try {
    if (req.method === 'GET') {
      const inventory = await getInventoryUseCase.execute();

      return res.status(200).json({
        success: true,
        data: inventory,
      });
    }

    if (req.method === 'POST') {
      // Initialize inventory with default stock
      await initializeInventoryUseCase.execute();
      const inventory = await getInventoryUseCase.execute();

      return res.status(200).json({
        success: true,
        message: 'Inventory initialized with default stock (5 units per ingredient)',
        data: inventory,
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error: any) {
    logger.error('Inventory API error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export default withCors(handler);
