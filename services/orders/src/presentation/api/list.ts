/**
 * API Endpoint: List Orders
 * Presentation layer for listing orders
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { dependencies } from '../../infrastructure/config/dependencies';
import { withMetrics } from '../../infrastructure/metrics/MetricsMiddleware';

async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const customerName = req.query.customerName as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const sortBy = req.query.sortBy as 'createdAt' | 'updatedAt';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    // Execute use case
    const result = await dependencies.listOrdersUseCase.execute({
      page,
      limit,
      status,
      customerName,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    });

    // Return response
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in list orders endpoint:', error);

    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve orders',
    });
  }
}

export default withMetrics(handler);