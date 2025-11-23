/**
 * HTTP Request Logging Middleware
 *
 * Wraps Vercel serverless functions with logging:
 * - Request details (method, path, headers)
 * - Response time
 * - Status codes
 * - Error tracking
 * - Request ID generation
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger, LogContext } from './Logger';
import { randomBytes } from 'crypto';

export type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>;

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * Extract relevant request data for logging
 */
function getRequestContext(req: VercelRequest, requestId: string): LogContext {
  return {
    requestId,
    method: req.method,
    path: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
    // Extract custom headers if present
    customerId: req.headers['x-customer-id'] as string,
    userId: req.headers['x-user-id'] as string,
  };
}

/**
 * Wrap response methods to capture status and timing
 */
function wrapResponse(
  res: VercelResponse,
  requestId: string,
  startTime: number,
  method: string,
  path: string
): VercelResponse {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const originalStatus = res.status.bind(res);

  let statusCode = 200;

  // Wrap status method
  res.status = (code: number) => {
    statusCode = code;
    return originalStatus(code);
  };

  // Wrap json method
  res.json = (body: any) => {
    const duration = Date.now() - startTime;

    logger.logResponse(method, path, statusCode, duration, {
      requestId,
      responseSize: JSON.stringify(body).length,
    });

    return originalJson(body);
  };

  // Wrap send method
  res.send = (body: any) => {
    const duration = Date.now() - startTime;

    logger.logResponse(method, path, statusCode, duration, {
      requestId,
      responseSize: typeof body === 'string' ? body.length : JSON.stringify(body).length,
    });

    return originalSend(body);
  };

  return res;
}

/**
 * Logging middleware for Vercel functions
 *
 * Usage:
 * export default withLogging(async (req, res) => {
 *   // your handler code
 * });
 */
export function withLogging(handler: Handler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const method = req.method || 'UNKNOWN';
    const path = req.url || '/';

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    // Get request context
    const context = getRequestContext(req, requestId);

    // Log incoming request
    logger.logRequest(method, path, context);

    // Wrap response to capture timing and status
    const wrappedRes = wrapResponse(res, requestId, startTime, method, path);

    try {
      // Execute the handler
      await handler(req, wrappedRes);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Log error
      logger.error('Request handler error', error, {
        ...context,
        duration,
        statusCode: 500,
      });

      // Send error response if headers not sent
      if (!wrappedRes.headersSent) {
        wrappedRes.status(500).json({
          error: 'Internal server error',
          requestId,
          message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    }
  };
}

/**
 * Create a request-scoped logger with context
 */
export function createRequestLogger(req: VercelRequest): typeof logger {
  const requestId = generateRequestId();
  const context = getRequestContext(req, requestId);

  return logger.child(context);
}
