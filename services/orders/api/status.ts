import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle both GET and PATCH requests
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orderId = req.query.id as string;

  if (!orderId) {
    return res.status(400).json({
      error: 'Order ID is required',
    });
  }

  try {
    if (req.method === 'GET') {
      // Get order status
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return res.status(404).json({
          error: 'Order not found',
        });
      }

      return res.status(200).json({
        success: true,
        order,
      });

    } else if (req.method === 'PATCH') {
      // Update order status (called by other services via events)
      const { status, completedAt } = req.body;

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(completedAt && { completedAt: new Date(completedAt) }),
        },
      });

      console.log(`Order ${orderId} status updated to: ${status}`);

      return res.status(200).json({
        success: true,
        order: updatedOrder,
      });
    }

  } catch (error) {
    console.error('Error handling order status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process order status',
    });
  }
}