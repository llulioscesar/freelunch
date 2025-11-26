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

interface OrderDetailsResponse {
  success?: boolean;
  order?: Order;
  error?: string;
}

interface StatusHistoryEntry {
  id: string;
  orderItemId: string;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  recipeId?: string;
  recipeName?: string;
  reason?: string;
}

interface OrderHistoryResponse {
  success?: boolean;
  history?: StatusHistoryEntry[];
  count?: number;
  error?: string;
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
    const response = await fetch(`${ORDERS_URL}/api/list?status=active&limit=20`);
    const data = (await response.json()) as OrdersResponse;
    return data.data || [];
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return [];
  }
}

export interface SearchOrdersParams {
  customerName?: string;
  status?: string;
  limit?: number;
}

export async function searchOrders(params: SearchOrdersParams): Promise<Order[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.customerName) queryParams.append('customerName', params.customerName);
    if (params.status) queryParams.append('status', params.status);
    queryParams.append('limit', String(params.limit || 10));

    const response = await fetch(`${ORDERS_URL}/api/list?${queryParams.toString()}`);
    const data = (await response.json()) as OrdersResponse;
    return data.data || [];
  } catch (error) {
    console.error('Error searching orders:', error);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const response = await fetch(`${ORDERS_URL}/api/status?id=${orderId}`);
    const data = (await response.json()) as OrderDetailsResponse;

    if (!data.success || !data.order) {
      return null;
    }

    return data.order;
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
}

export async function getOrderHistory(orderId: string): Promise<StatusHistoryEntry[]> {
  try {
    const response = await fetch(`${ORDERS_URL}/api/history?orderId=${orderId}`);
    const data = (await response.json()) as OrderHistoryResponse;
    return data.history || [];
  } catch (error) {
    console.error('Error fetching order history:', error);
    return [];
  }
}
