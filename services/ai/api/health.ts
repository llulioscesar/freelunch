import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  return res.status(200).json({
    success: true,
    service: 'ai',
    status: hasGeminiKey ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    config: {
      geminiConfigured: hasGeminiKey,
      warehouseUrl: process.env.WAREHOUSE_URL || 'http://localhost:3003',
      kitchenUrl: process.env.KITCHEN_URL || 'http://localhost:3001',
    },
  });
}
