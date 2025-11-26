/**
 * API Endpoint: Purchases
 * Get purchase history from the farmers market
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GetPurchaseHistoryUseCase } from '../../application/use-cases/GetPurchaseHistoryUseCase.js';
import { PrismaPurchaseRepository } from '../../infrastructure/adapters/persistence/PrismaPurchaseRepository.js';
import { withCors } from '../../infrastructure/http/cors.js';
import { logger } from '../../infrastructure/logging/Logger.js';

let purchaseRepository: PrismaPurchaseRepository | null = null;
let getPurchaseHistoryUseCase: GetPurchaseHistoryUseCase | null = null;

function getUseCase() {
  if (!purchaseRepository) {
    purchaseRepository = new PrismaPurchaseRepository();
  }
  if (!getPurchaseHistoryUseCase) {
    getPurchaseHistoryUseCase = new GetPurchaseHistoryUseCase(purchaseRepository);
  }
  return getPurchaseHistoryUseCase;
}

async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const useCase = getUseCase();

    // Parse limit from query params
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;

    const history = await useCase.execute({ limit });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    logger.error('Purchases API error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export default withCors(handler);
