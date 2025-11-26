/**
 * CORS Middleware for Vercel Functions
 */
import { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = ['*'];
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'x-vercel-protection-bypass',
];

/**
 * Sets CORS headers on the response
 */
export function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.join(', '));
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Handles OPTIONS preflight requests
 */
export function handlePreflight(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;

/**
 * CORS middleware wrapper for Vercel handlers
 */
export function withCors(handler: Handler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Set CORS headers for all responses
    setCorsHeaders(res);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Call the actual handler
    return handler(req, res);
  };
}
