/**
 * API Endpoint: Health Check
 * Presentation layer for service health check
 */
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add actual health checks (DB connection, dependencies, etc.)

    return res.status(200).json({
      service: 'orders-service',
      status: 'healthy',
      version: '2.0.0', // Updated for hexagonal architecture
      architecture: 'hexagonal',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /api/create - Create new order',
        'GET /api/list - List all orders',
        'GET /api/status?id={orderId} - Get order status',
        'PATCH /api/status?id={orderId} - Update order status',
      ],
      layers: {
        domain: 'Ready',
        application: 'Ready',
        infrastructure: 'Ready',
        presentation: 'Ready',
      },
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