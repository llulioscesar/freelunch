/**
 * Logger Utility
 * Centralized logging for the Kitchen service
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SILENT = 'SILENT',
}

class Logger {
  private logLevel: LogLevel;
  private serviceName: string = 'kitchen-service';

  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return (LogLevel as any)[level] || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.logLevel === LogLevel.SILENT) return false;

    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, metadata?: any): string {
    const timestamp = new Date().toISOString();
    const meta = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${this.serviceName}] [${level}] ${message}${meta}`;
  }

  debug(message: string, metadata?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, metadata));
    }
  }

  info(message: string, metadata?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, metadata));
    }
  }

  warn(message: string, metadata?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, metadata));
    }
  }

  error(message: string, error?: Error | any, metadata?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorDetails = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;

      console.error(
        this.formatMessage(LogLevel.ERROR, message, {
          ...metadata,
          error: errorDetails,
        })
      );
    }
  }

  // Domain Event Logging
  logDomainEvent(eventName: string, aggregateId: string, metadata?: any): void {
    this.info(`Domain Event: ${eventName}`, {
      aggregateId,
      ...metadata,
    });
  }

  // Use Case Logging
  logUseCaseStart(useCaseName: string, input?: any): void {
    this.debug(`Use Case Started: ${useCaseName}`, input);
  }

  logUseCaseEnd(useCaseName: string, durationMs: number, output?: any): void {
    this.debug(`Use Case Completed: ${useCaseName}`, {
      durationMs,
      ...output,
    });
  }

  logUseCaseError(useCaseName: string, error: Error | any): void {
    this.error(`Use Case Failed: ${useCaseName}`, error);
  }

  // Repository Logging
  logRepositoryOperation(operation: string, entity: string, id?: string): void {
    this.debug(`Repository ${operation}: ${entity}`, { id });
  }

  // HTTP Request Logging
  logHttpRequest(method: string, url: string, statusCode?: number): void {
    this.info(`HTTP ${method} ${url}`, { statusCode });
  }
}

export const logger = new Logger();
