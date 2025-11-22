import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health check endpoint for Orders Service
 * GET /api or GET /
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection (optional)
    // await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      service: 'orders-service',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /api/create - Create new order',
        'GET /api/list - List all orders',
        'GET /api/status?id={orderId} - Get order status',
        'PATCH /api/status?id={orderId} - Update order status',
      ],
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      service: 'orders-service',
      status: 'unhealthy',
      error: 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}