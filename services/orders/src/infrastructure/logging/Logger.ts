/**
 * Structured Logger Service
 *
 * Uses Pino for high-performance JSON logging with:
 * - Structured fields for searchability
 * - Context propagation (trace IDs, user IDs, etc.)
 * - Different log levels
 * - Pretty printing in development
 * - JSON output in production
 */
import pino, { Logger as PinoLogger } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  // Request context
  requestId?: string;
  userId?: string;
  customerId?: string;

  // Business context
  orderId?: string;
  aggregateId?: string;
  eventType?: string;

  // Performance metrics
  duration?: number;
  responseTime?: number;

  // Error context
  errorCode?: string;
  errorStack?: string;

  // Infrastructure
  service?: string;
  layer?: string;
  method?: string;

  // Custom fields
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private logger: PinoLogger;
  private serviceName: string;

  private constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'orders-service';

    // Detect if running in serverless/production environment
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production' || isVercel;
    const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;

    this.logger = pino({
      name: this.serviceName,
      level: logLevel,

      // Base fields included in every log
      base: {
        service: this.serviceName,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },

      // Timestamp format
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

      // Pretty print only in local development (not in Vercel/production)
      transport: !isProduction
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          }
        : undefined,

      // Redact sensitive fields
      redact: {
        paths: [
          'password',
          'token',
          'authorization',
          'cookie',
          'apiKey',
          'secret',
        ],
        censor: '[REDACTED]',
      },

      // Serializers for common objects
      serializers: {
        error: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
    });
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Create a child logger with persistent context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  // ==================== Log Methods ====================

  trace(message: string, context?: LogContext): void {
    this.logger.trace(context, message);
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(context, message);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(context, message);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(context, message);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(
      {
        ...context,
        error: error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : undefined,
      },
      message
    );
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.logger.fatal(
      {
        ...context,
        error: error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : undefined,
      },
      message
    );
  }

  // ==================== Domain-Specific Methods ====================

  /**
   * Log HTTP request
   */
  logRequest(method: string, path: string, context?: LogContext): void {
    this.info('HTTP Request', {
      ...context,
      layer: 'presentation',
      method,
      path,
      type: 'http_request',
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this.logger[level]({
      ...context,
      layer: 'presentation',
      method,
      path,
      statusCode,
      duration,
      type: 'http_response',
    }, `HTTP Response ${statusCode}`);
  }

  /**
   * Log domain event
   */
  logDomainEvent(eventType: string, aggregateId: string, context?: LogContext): void {
    this.info('Domain Event', {
      ...context,
      layer: 'domain',
      eventType,
      aggregateId,
      type: 'domain_event',
    });
  }

  /**
   * Log use case execution
   */
  logUseCaseStart(useCaseName: string, context?: LogContext): void {
    this.debug(`Use Case Started: ${useCaseName}`, {
      ...context,
      layer: 'application',
      useCaseName,
      type: 'use_case_start',
    });
  }

  logUseCaseEnd(useCaseName: string, duration: number, context?: LogContext): void {
    this.debug(`Use Case Completed: ${useCaseName}`, {
      ...context,
      layer: 'application',
      useCaseName,
      duration,
      type: 'use_case_end',
    });
  }

  logUseCaseError(useCaseName: string, error: Error, context?: LogContext): void {
    this.error(`Use Case Failed: ${useCaseName}`, error, {
      ...context,
      layer: 'application',
      useCaseName,
      type: 'use_case_error',
    });
  }

  /**
   * Log repository operation
   */
  logRepositoryOperation(
    operation: string,
    entityType: string,
    entityId?: string,
    context?: LogContext
  ): void {
    this.debug(`Repository: ${operation}`, {
      ...context,
      layer: 'infrastructure',
      operation,
      entityType,
      entityId,
      type: 'repository_operation',
    });
  }

  /**
   * Log cache operation
   */
  logCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'del',
    key: string,
    context?: LogContext
  ): void {
    this.debug(`Cache ${operation.toUpperCase()}`, {
      ...context,
      layer: 'infrastructure',
      cacheOperation: operation,
      cacheKey: key,
      type: 'cache_operation',
    });
  }

  /**
   * Log event publishing
   */
  logEventPublished(
    eventType: string,
    streamName: string,
    messageId?: string,
    context?: LogContext
  ): void {
    this.info('Event Published', {
      ...context,
      layer: 'infrastructure',
      eventType,
      streamName,
      messageId,
      type: 'event_published',
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(
    operation: string,
    duration: number,
    context?: LogContext
  ): void {
    const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';

    this.logger[level]({
      ...context,
      operation,
      duration,
      type: 'performance_metric',
    }, `Performance: ${operation} took ${duration}ms`);
  }

  /**
   * Log business metric
   */
  logMetric(metricName: string, value: number, context?: LogContext): void {
    this.info('Business Metric', {
      ...context,
      metricName,
      metricValue: value,
      type: 'business_metric',
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
