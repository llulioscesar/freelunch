import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../dist/presentation/api/recipes.js';

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
