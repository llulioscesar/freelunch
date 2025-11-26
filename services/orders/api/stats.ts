/**
 * API Endpoint: Get Order Statistics
 * Returns aggregated stats for the dashboard
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GetOrderStatsUseCase } from '../src/application/use-cases/GetOrderStatsUseCase';
import { PrismaOrderRepository } from '../src/infrastructure/adapters/persistence/PrismaOrderRepository';
import { withCors } from '../src/infrastructure/http/cors';
import { logger } from '../src/infrastructure/logging/Logger';

let orderRepository: PrismaOrderRepository | null = null;
let getOrderStatsUseCase: GetOrderStatsUseCase | null = null;

function getUseCase(): GetOrderStatsUseCase {
  if (!orderRepository) {
    orderRepository = new PrismaOrderRepository();
  }
  if (!getOrderStatsUseCase) {
    getOrderStatsUseCase = new GetOrderStatsUseCase(orderRepository);
  }
  return getOrderStatsUseCase;
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
    const stats = await useCase.execute();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error('Stats API error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

export default withCors(handler);
