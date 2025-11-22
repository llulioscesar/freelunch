import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { Client } from '@upstash/qstash';
import { generateOrderId, OrderStatus } from '../lib/utils';
import { prisma } from '../lib/prisma';

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Request validation schema
const createOrderSchema = z.object({
  quantity: z.number().min(1).max(100),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const body = createOrderSchema.parse(req.body);

    // Generate unique order ID
    const orderId = generateOrderId();

    // Create order in database
    const order = await prisma.order.create({
      data: {
        id: orderId,
        quantity: body.quantity,
        customerName: body.customerName || 'Anonymous',
        notes: body.notes,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
      },
    });

    // Publish ORDER_CREATED event to Kitchen service
    await qstash.publishJSON({
      url: process.env.KITCHEN_SERVICE_URL + '/api/prepare',
      body: {
        event: 'ORDER_CREATED',
        orderId: order.id,
        quantity: order.quantity,
        timestamp: new Date().toISOString(),
      },
      retries: 3,
      delay: 0,
    });

    // Log event for monitoring
    console.log(`Order created: ${orderId} - Quantity: ${body.quantity}`);

    // Return successful response
    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        quantity: order.quantity,
        status: order.status,
        createdAt: order.createdAt,
      },
      message: 'Order created successfully and sent to kitchen',
    });

  } catch (error) {
    console.error('Error creating order:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create order',
    });
  }
}