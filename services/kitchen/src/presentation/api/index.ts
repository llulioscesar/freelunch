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
    return res.status(200).json({
      service: 'kitchen-service',
      status: 'healthy',
      version: '0.0.1',
      architecture: 'hexagonal-ddd',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/recipes - List available recipes',
        'GET /api/plates - List plates (supports ?status= and ?orderId= filters)',
        'GET /api/metrics - Prometheus metrics endpoint',
      ],
      layers: {
        domain: 'Ready',
        application: 'Ready',
        infrastructure: 'Ready',
        presentation: 'Ready',
      },
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      service: 'kitchen-service',
      status: 'unhealthy',
      error: error.message || 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}
