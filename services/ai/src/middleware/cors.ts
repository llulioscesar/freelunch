import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function withCors(handler: Handler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Set CORS headers for all responses
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return handler(req, res);
  };
}
