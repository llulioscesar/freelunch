/**
 * Service: Health Check
 *
 * Performs comprehensive health checks on all service dependencies:
 * - Database connectivity
 * - Event publisher availability
 * - Environment configuration
 */

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: CheckStatus;
    eventPublisher: CheckStatus;
    configuration: CheckStatus;
  };
  timestamp: string;
  uptime: number;
  version: string;
}

export interface CheckStatus {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  responseTime?: number;
  details?: any;
}

export interface HealthChecker {
  checkDatabase(): Promise<CheckStatus>;
  checkEventPublisher(): Promise<CheckStatus>;
  checkConfiguration(): Promise<CheckStatus>;
}

export class HealthCheckService {
  private startTime: number;

  constructor(private readonly healthChecker: HealthChecker) {
    this.startTime = Date.now();
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.healthChecker.checkDatabase(),
      this.healthChecker.checkEventPublisher(),
      this.healthChecker.checkConfiguration(),
    ]);

    const databaseCheck = checks[0].status === 'fulfilled'
      ? checks[0].value
      : { status: 'down' as const, message: 'Check failed' };

    const eventPublisherCheck = checks[1].status === 'fulfilled'
      ? checks[1].value
      : { status: 'down' as const, message: 'Check failed' };

    const configurationCheck = checks[2].status === 'fulfilled'
      ? checks[2].value
      : { status: 'down' as const, message: 'Check failed' };

    const overallStatus = this.determineOverallStatus({
      database: databaseCheck,
      eventPublisher: eventPublisherCheck,
      configuration: configurationCheck,
    });

    return {
      status: overallStatus,
      checks: {
        database: databaseCheck,
        eventPublisher: eventPublisherCheck,
        configuration: configurationCheck,
      },
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: '2.0.0',
    };
  }

  private determineOverallStatus(checks: {
    database: CheckStatus;
    eventPublisher: CheckStatus;
    configuration: CheckStatus;
  }): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = [
      checks.database.status,
      checks.eventPublisher.status,
      checks.configuration.status,
    ];

    // If database is down, service is unhealthy (critical dependency)
    if (checks.database.status === 'down') {
      return 'unhealthy';
    }

    // If any check is down, service is degraded
    if (statuses.includes('down')) {
      return 'degraded';
    }

    // If any check is degraded, overall is degraded
    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    // All checks passed
    return 'healthy';
  }
}
