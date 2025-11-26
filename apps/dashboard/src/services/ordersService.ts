/**
 * Orders Service - API Client
 */
import { apiConfig, apiFetch } from './api';
import type { StatsResponse, OrdersResponse, Order } from '../types/api';

const BASE_URL = apiConfig.urls.orders;

export const ordersService = {
  /**
   * Get order statistics for dashboard
   */
  async getStats(): Promise<StatsResponse> {
    return apiFetch<StatsResponse>(`${BASE_URL}/api/stats`);
  },

  /**
   * Get all orders
   */
  async getAll(): Promise<OrdersResponse> {
    return apiFetch<OrdersResponse>(`${BASE_URL}/api/list`);
  },

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<{ success: boolean; order: Order }> {
    return apiFetch(`${BASE_URL}/api/status?id=${id}`);
  },

  /**
   * Create a new order
   */
  async create(quantity: number, customerName?: string, notes?: string): Promise<{ success: boolean; order: Order }> {
    return apiFetch(`${BASE_URL}/api/create`, {
      method: 'POST',
      body: JSON.stringify({ quantity, customerName, notes }),
    });
  },
};
