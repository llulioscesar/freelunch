import { OrdersStats, Order } from '../types';

const ORDERS_URL = process.env.ORDERS_URL || 'http://localhost:3002';

interface StatsResponse {
  success?: boolean;
  stats?: OrdersStats;
}

interface OrdersResponse {
  success?: boolean;
  data?: Order[];
}

export async function getOrdersStats(): Promise<OrdersStats | null> {
  try {
    const response = await fetch(`${ORDERS_URL}/api/stats`);
    const data = (await response.json()) as StatsResponse;
    return data.stats || null;
  } catch (error) {
    console.error('Error fetching orders stats:', error);
    return null;
  }
}

export async function getActiveOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${ORDERS_URL}/api/orders?status=active&limit=20`);
    const data = (await response.json()) as OrdersResponse;
    return data.data || [];
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return [];
  }
}
