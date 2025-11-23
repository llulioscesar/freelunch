/**
 * Unit Tests: HealthCheckService (with mocks)
 */
import { HealthCheckService, HealthChecker, CheckStatus } from '../../../../src/application/services/HealthCheckService';

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;
  let mockHealthChecker: jest.Mocked<HealthChecker>;

  beforeEach(() => {
    mockHealthChecker = {
      checkDatabase: jest.fn(),
      checkEventPublisher: jest.fn(),
      checkConfiguration: jest.fn(),
    };

    healthCheckService = new HealthCheckService(mockHealthChecker);
  });

  describe('performHealthCheck', () => {
    it('should return healthy status when all checks pass', async () => {
      const upStatus: CheckStatus = { status: 'up', responseTime: 10 };

      mockHealthChecker.checkDatabase.mockResolvedValue(upStatus);
      mockHealthChecker.checkEventPublisher.mockResolvedValue(upStatus);
      mockHealthChecker.checkConfiguration.mockResolvedValue(upStatus);

      const result = await healthCheckService.performHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.checks.database.status).toBe('up');
      expect(result.checks.eventPublisher.status).toBe('up');
      expect(result.checks.configuration.status).toBe('up');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.version).toBe('2.0.0');
    });

    it('should return degraded status when one check is down', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'down', message: 'Connection failed' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      const result = await healthCheckService.performHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.eventPublisher.status).toBe('down');
    });

    it('should return unhealthy status when database is down', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'down', message: 'DB connection failed' });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      const result = await healthCheckService.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('down');
    });

    it('should return unhealthy when multiple checks fail', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'down' });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'down' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      const result = await healthCheckService.performHealthCheck();

      expect(result.status).toBe('unhealthy');
    });

    it('should handle check exceptions gracefully', async () => {
      mockHealthChecker.checkDatabase.mockRejectedValue(new Error('Database error'));
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      const result = await healthCheckService.performHealthCheck();

      expect(result.checks.database.status).toBe('down');
      expect(result.checks.database.message).toBe('Check failed');
    });

    it('should handle all checks failing', async () => {
      mockHealthChecker.checkDatabase.mockRejectedValue(new Error('DB error'));
      mockHealthChecker.checkEventPublisher.mockRejectedValue(new Error('Publisher error'));
      mockHealthChecker.checkConfiguration.mockRejectedValue(new Error('Config error'));

      const result = await healthCheckService.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('down');
      expect(result.checks.eventPublisher.status).toBe('down');
      expect(result.checks.configuration.status).toBe('down');
    });

    it('should include response time in checks', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'up', responseTime: 25 });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'up', responseTime: 15 });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up', responseTime: 5 });

      const result = await healthCheckService.performHealthCheck();

      expect(result.checks.database.responseTime).toBe(25);
      expect(result.checks.eventPublisher.responseTime).toBe(15);
      expect(result.checks.configuration.responseTime).toBe(5);
    });

    it('should handle degraded status for checks', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'degraded', message: 'Slow response' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      const result = await healthCheckService.performHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.eventPublisher.status).toBe('degraded');
    });

    it('should track uptime correctly', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      // Wait a bit to ensure uptime > 0
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = await healthCheckService.performHealthCheck();

      expect(result.uptime).toBeGreaterThanOrEqual(1);
    });

    it('should return degraded when configuration is down', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'down' });

      const result = await healthCheckService.performHealthCheck();

      expect(result.status).toBe('degraded');
    });

    it('should include details in check results', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({
        status: 'up',
        details: { host: 'localhost', port: 5432 }
      });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      const result = await healthCheckService.performHealthCheck();

      expect(result.checks.database.details).toEqual({ host: 'localhost', port: 5432 });
    });
  });
});
