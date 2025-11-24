import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../dist/presentation/api/plates.js';

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
