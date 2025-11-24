/**
 * Request Logger Middleware
 * Logs HTTP requests and responses
 */
import { logger } from './Logger';

export interface RequestInfo {
  method: string;
  url: string;
  headers?: any;
  body?: any;
}

export interface ResponseInfo {
  statusCode: number;
  body?: any;
  error?: any;
}

export class RequestLogger {
  static logRequest(request: RequestInfo): void {
    logger.info(`Incoming Request: ${request.method} ${request.url}`, {
      method: request.method,
      url: request.url,
      headers: request.headers,
    });
  }

  static logResponse(
    request: RequestInfo,
    response: ResponseInfo,
    durationMs: number
  ): void {
    const level = response.statusCode >= 400 ? 'error' : 'info';

    if (level === 'error') {
      logger.error(
        `Request Failed: ${request.method} ${request.url}`,
        response.error,
        {
          statusCode: response.statusCode,
          durationMs,
        }
      );
    } else {
      logger.info(`Request Completed: ${request.method} ${request.url}`, {
        statusCode: response.statusCode,
        durationMs,
      });
    }
  }
}
