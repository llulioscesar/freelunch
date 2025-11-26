/**
 * API Endpoint: Health Check
 * Presentation layer for service health check
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { HealthCheckService } from '../../application/services/HealthCheckService.js';
import { SystemHealthChecker } from '../../infrastructure/adapters/health/SystemHealthChecker.js';
import { withCors } from '../../infrastructure/http/cors.js';

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

async function handler(
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
      service: 'kitchen-service',
      status: healthResult.status,
      version: healthResult.version,
      architecture: 'hexagonal-ddd',
      timestamp: healthResult.timestamp,
      uptime: healthResult.uptime,
      checks: healthResult.checks,
      endpoints: [
        'GET /api/recipes - List available recipes',
        'GET /api/plates - List plates (supports ?status= and ?orderId= filters)',
        'GET /api/history?orderId={orderId} - Get status history for all plates in order',
        'GET /api/history?plateId={plateId} - Get status history for specific plate',
        'GET /api/metrics - Prometheus metrics endpoint',
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
      service: 'kitchen-service',
      status: 'unhealthy',
      error: error.message || 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}

export default withCors(handler);
