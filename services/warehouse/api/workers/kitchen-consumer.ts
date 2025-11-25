/**
 * Kitchen Requests Consumer Worker
 * Warehouse Service
 *
 * Serverless worker that processes ingredient requests from Kitchen service.
 * Triggered by Vercel Cron to process batches of requests.
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../dist/presentation/api/process-requests.js';

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
