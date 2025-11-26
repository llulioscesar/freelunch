/**
 * Warehouse Service - API Client
 */
import { apiConfig, apiFetch } from './api';
import type { InventoryResponse, PurchasesResponse } from '../types/api';

const BASE_URL = apiConfig.urls.warehouse;

export const warehouseService = {
  /**
   * Get current inventory
   */
  async getInventory(): Promise<InventoryResponse> {
    return apiFetch<InventoryResponse>(`${BASE_URL}/api/inventory`);
  },

  /**
   * Initialize inventory with default stock (5 per ingredient)
   */
  async initializeInventory(): Promise<InventoryResponse> {
    return apiFetch<InventoryResponse>(`${BASE_URL}/api/inventory`, {
      method: 'POST',
    });
  },

  /**
   * Get purchase history from farmers market
   */
  async getPurchases(page: number = 1, limit: number = 10): Promise<PurchasesResponse> {
    return apiFetch<PurchasesResponse>(`${BASE_URL}/api/purchases?page=${page}&limit=${limit}`);
  },
};
