/**
 * API Endpoint: Order Status
 * Presentation layer for getting and updating order status
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { dependencies } from '../../infrastructure/config/dependencies';
import { withMetrics } from '../../infrastructure/metrics/MetricsMiddleware';

// Request validation schema for update
const updateStatusSchema = z.object({
  status: z.string(),
  completedAt: z.string().optional(),
});

async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const orderId = req.query.id as string;

  if (!orderId) {
    return res.status(400).json({
      error: 'Order ID is required',
    });
  }

  try {
    if (req.method === 'GET') {
      // Get order status
      const result = await dependencies.getOrderStatusUseCase.execute({
        orderId,
      });

      if (!result.success) {
        return res.status(404).json({
          error: result.error,
        });
      }

      return res.status(200).json(result);
    } else if (req.method === 'PATCH') {
      // Update order status
      const body = updateStatusSchema.parse(req.body);

      const result = await dependencies.updateOrderStatusUseCase.execute({
        orderId,
        status: body.status,
        completedAt: body.completedAt,
      });

      if (!result.success) {
        return res.status(404).json({
          error: result.error,
        });
      }

      return res.status(200).json(result);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in order status endpoint:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process order status',
    });
  }
}

export default withMetrics(handler);