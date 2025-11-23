import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../src/presentation/api/list';

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
