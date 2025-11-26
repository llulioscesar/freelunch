/**
 * Orders Service - API Client
 */
import { apiConfig, apiFetch } from './api';
import type { StatsResponse, OrdersResponse, Order, StatusHistoryEntry } from '../types/api';

const BASE_URL = apiConfig.urls.orders;

export const ordersService = {
  /**
   * Get order statistics for dashboard
   */
  async getStats(): Promise<StatsResponse> {
    return apiFetch<StatsResponse>(`${BASE_URL}/api/stats`);
  },

  /**
   * Get all orders with pagination
   */
  async getAll(page: number = 1, limit: number = 10): Promise<OrdersResponse> {
    return apiFetch<OrdersResponse>(`${BASE_URL}/api/list?page=${page}&limit=${limit}`);
  },

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<{ success: boolean; order: Order }> {
    return apiFetch(`${BASE_URL}/api/status?id=${id}`);
  },

  /**
   * Get status history for an order
   */
  async getHistory(orderId: string): Promise<{ success: boolean; history: StatusHistoryEntry[] }> {
    return apiFetch(`${BASE_URL}/api/history?orderId=${orderId}`);
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
