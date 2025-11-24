/**
 * Health Check Endpoint
 * Kitchen Service - Vercel Serverless Function
 *
 * GET / - Returns service health status
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from '../src/infrastructure/logging/Logger.js';

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    logger.info('Health check requested');

    return res.status(200).json({
      service: 'kitchen',
      status: 'healthy',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error: any) {
    logger.error('Health check failed', error);

    return res.status(500).json({
      service: 'kitchen',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
