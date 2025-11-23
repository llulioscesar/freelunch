/**
 * API Endpoint: Health Check
 * Presentation layer for service health check
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { HealthCheckService } from '@application/services/HealthCheckService';
import { SystemHealthChecker } from '@infrastructure/adapters/health/SystemHealthChecker';

// Singleton instance for health checker
let healthChecker: SystemHealthChecker | null = null;
let healthCheckService: HealthCheckService | null = null;

function getHealthCheckService(): HealthCheckService {
  if (!healthChecker) {
    healthChecker = new SystemHealthChecker();
  }
  if (!healthCheckService) {
    healthCheckService = new HealthCheckService(healthChecker);
  }
  return healthCheckService;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const service = getHealthCheckService();
    const healthResult = await service.performHealthCheck();

    // Determine HTTP status code based on health status
    const statusCode =
      healthResult.status === 'healthy' ? 200 :
      healthResult.status === 'degraded' ? 200 :
      503;

    return res.status(statusCode).json({
      service: 'orders-service',
      status: healthResult.status,
      version: healthResult.version,
      architecture: 'hexagonal',
      timestamp: healthResult.timestamp,
      uptime: healthResult.uptime,
      checks: healthResult.checks,
      endpoints: [
        'POST /api/create - Create new order',
        'GET /api/list - List all orders',
        'GET /api/status?id={orderId} - Get order status',
        'PATCH /api/status?id={orderId} - Update order status',
      ],
      layers: {
        domain: 'Ready',
        application: 'Ready',
        infrastructure: healthResult.checks.database.status === 'up' ? 'Ready' : 'Degraded',
        presentation: 'Ready',
      },
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      service: 'orders-service',
      status: 'unhealthy',
      error: error.message || 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}