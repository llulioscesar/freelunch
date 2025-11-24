/**
 * Metrics Middleware
 * Kitchen Service
 *
 * Automatically instruments HTTP requests with metrics collection.
 * Wraps Vercel serverless function handlers.
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { metricsService } from './MetricsService.js';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>;

/**
 * Wrap a handler with metrics collection
 */
export function withMetrics(handler: Handler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const startTime = Date.now();
    const method = req.method || 'UNKNOWN';
    const endpoint = getEndpointName(req.url || '/');

    // Intercept res.status() to capture status code
    let statusCode = 200;
    const originalStatus = res.status.bind(res);
    res.status = (code: number) => {
      statusCode = code;
      return originalStatus(code);
    };

    // Intercept res.json() to capture status code
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      recordMetrics();
      return originalJson(body);
    };

    // Intercept res.send() to capture status code
    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
      recordMetrics();
      return originalSend(body);
    };

    // Execute handler
    try {
      const result = await handler(req, res);

      // Record metrics if response wasn't sent yet
      if (!res.writableEnded) {
        recordMetrics();
      }

      return result;
    } catch (error) {
      // Record error metrics
      statusCode = 500;
      recordMetrics();
      throw error;
    }

    function recordMetrics() {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordHttpRequest(method, endpoint, statusCode, durationSeconds);
    }
  };
}

/**
 * Extract endpoint name from URL
 * /api/recipes?foo=bar -> /api/recipes
 * /api/plates?status=READY -> /api/plates
 */
function getEndpointName(url: string): string {
  try {
    const urlObj = new URL(url, 'http://localhost');
    return urlObj.pathname;
  } catch {
    return url.split('?')[0];
  }
}

/**
 * Wrap async function with timing metrics
 */
export function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  return fn()
    .then(result => {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery(operation, durationSeconds, false);
      return result;
    })
    .catch(error => {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery(operation, durationSeconds, true);
      throw error;
    });
}

/**
 * Wrap sync function with timing metrics
 */
export function measure<T>(
  operation: string,
  fn: () => T
): T {
  const startTime = Date.now();

  try {
    const result = fn();
    const durationSeconds = (Date.now() - startTime) / 1000;
    metricsService.recordDatabaseQuery(operation, durationSeconds, false);
    return result;
  } catch (error) {
    const durationSeconds = (Date.now() - startTime) / 1000;
    metricsService.recordDatabaseQuery(operation, durationSeconds, true);
    throw error;
  }
}
