import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../dist/presentation/api/status';

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
