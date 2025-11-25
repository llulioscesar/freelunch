/**
 * API Endpoint: Health Check
 * Warehouse Service Health Check
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { HealthCheckService } from '../../application/services/HealthCheckService.js';
import { SystemHealthChecker } from '../../infrastructure/adapters/health/SystemHealthChecker.js';

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

    const statusCode =
      healthResult.status === 'healthy'
        ? 200
        : healthResult.status === 'degraded'
          ? 200
          : 503;

    return res.status(statusCode).json({
      service: 'warehouse-service',
      status: healthResult.status,
      version: healthResult.version,
      architecture: 'hexagonal-ddd',
      timestamp: healthResult.timestamp,
      uptime: healthResult.uptime,
      checks: healthResult.checks,
      endpoints: [
        'GET /api/inventory - Get current inventory',
        'POST /api/inventory - Initialize inventory with default stock',
        'GET /api/purchases - Get purchase history',
      ],
      layers: {
        domain: 'Ready',
        application: 'Ready',
        infrastructure:
          healthResult.checks.database.status === 'up' ? 'Ready' : 'Degraded',
        presentation: 'Ready',
      },
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      service: 'warehouse-service',
      status: 'unhealthy',
      error: error.message || 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}
