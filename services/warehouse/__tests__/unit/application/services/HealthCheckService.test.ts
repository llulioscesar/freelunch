import {
  HealthCheckService,
  HealthChecker,
} from '../../../../src/application/services/HealthCheckService';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let mockHealthChecker: jest.Mocked<HealthChecker>;

  beforeEach(() => {
    mockHealthChecker = {
      checkDatabase: jest.fn(),
      checkEventPublisher: jest.fn(),
      checkConfiguration: jest.fn(),
    };

    service = new HealthCheckService(mockHealthChecker);
  });

  describe('performHealthCheck', () => {
    it('should return healthy when all checks pass', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({
        status: 'up',
        message: 'Database OK',
        responseTime: 10,
      });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({
        status: 'up',
        message: 'Redis OK',
        responseTime: 5,
      });
      mockHealthChecker.checkConfiguration.mockResolvedValue({
        status: 'up',
        message: 'Config OK',
        responseTime: 1,
      });

      const result = await service.performHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.checks.database.status).toBe('up');
      expect(result.checks.eventPublisher.status).toBe('up');
      expect(result.checks.configuration.status).toBe('up');
      expect(result.version).toBe('0.0.1');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy when database is down', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({
        status: 'down',
        message: 'Database connection failed',
      });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({
        status: 'up',
        message: 'Redis OK',
      });
      mockHealthChecker.checkConfiguration.mockResolvedValue({
        status: 'up',
        message: 'Config OK',
      });

      const result = await service.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('down');
    });

    it('should return degraded when event publisher is down', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({
        status: 'up',
        message: 'Database OK',
      });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({
        status: 'down',
        message: 'Redis connection failed',
      });
      mockHealthChecker.checkConfiguration.mockResolvedValue({
        status: 'up',
        message: 'Config OK',
      });

      const result = await service.performHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.eventPublisher.status).toBe('down');
    });

    it('should return degraded when configuration is degraded', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({
        status: 'up',
        message: 'Database OK',
      });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({
        status: 'up',
        message: 'Redis OK',
      });
      mockHealthChecker.checkConfiguration.mockResolvedValue({
        status: 'degraded',
        message: 'Missing optional config',
      });

      const result = await service.performHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.configuration.status).toBe('degraded');
    });

    it('should handle check failures gracefully', async () => {
      mockHealthChecker.checkDatabase.mockRejectedValue(new Error('Connection timeout'));
      mockHealthChecker.checkEventPublisher.mockResolvedValue({
        status: 'up',
        message: 'Redis OK',
      });
      mockHealthChecker.checkConfiguration.mockResolvedValue({
        status: 'up',
        message: 'Config OK',
      });

      const result = await service.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('down');
      expect(result.checks.database.message).toBe('Check failed');
    });

    it('should handle event publisher check failure', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({
        status: 'up',
        message: 'Database OK',
      });
      mockHealthChecker.checkEventPublisher.mockRejectedValue(new Error('Redis timeout'));
      mockHealthChecker.checkConfiguration.mockResolvedValue({
        status: 'up',
        message: 'Config OK',
      });

      const result = await service.performHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.eventPublisher.status).toBe('down');
    });

    it('should handle configuration check failure', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({
        status: 'up',
        message: 'Database OK',
      });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({
        status: 'up',
        message: 'Redis OK',
      });
      mockHealthChecker.checkConfiguration.mockRejectedValue(new Error('Config error'));

      const result = await service.performHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.configuration.status).toBe('down');
    });

    it('should handle all checks failing', async () => {
      mockHealthChecker.checkDatabase.mockRejectedValue(new Error('DB error'));
      mockHealthChecker.checkEventPublisher.mockRejectedValue(new Error('Redis error'));
      mockHealthChecker.checkConfiguration.mockRejectedValue(new Error('Config error'));

      const result = await service.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('down');
      expect(result.checks.eventPublisher.status).toBe('down');
      expect(result.checks.configuration.status).toBe('down');
    });

    it('should track uptime correctly', async () => {
      mockHealthChecker.checkDatabase.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkEventPublisher.mockResolvedValue({ status: 'up' });
      mockHealthChecker.checkConfiguration.mockResolvedValue({ status: 'up' });

      // Wait a bit to ensure some uptime
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.performHealthCheck();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof result.uptime).toBe('number');
    });
  });
});
