import { InventoryItem, PurchaseStats, Purchase, WarehouseStats } from '../types';

const WAREHOUSE_URL = process.env.WAREHOUSE_URL || 'http://localhost:3003';

interface InventoryResponse {
  data?: { items?: InventoryItem[] };
}

interface PurchasesResponse {
  data?: {
    purchases?: Purchase[];
    total?: number;
    successful?: number;
    failed?: number;
  };
}

interface StatsResponse {
  success?: boolean;
  data?: WarehouseStats;
}

export async function getInventory(): Promise<InventoryItem[]> {
  try {
    const response = await fetch(`${WAREHOUSE_URL}/api/inventory`);
    const data = (await response.json()) as InventoryResponse;
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

export async function getPurchaseStats(): Promise<PurchaseStats> {
  try {
    const response = await fetch(`${WAREHOUSE_URL}/api/purchases?limit=1`);
    const data = (await response.json()) as PurchasesResponse;
    return {
      total: data.data?.total || 0,
      successful: data.data?.successful || 0,
      failed: data.data?.failed || 0,
    };
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    return { total: 0, successful: 0, failed: 0 };
  }
}

export async function getRecentPurchases(limit = 20): Promise<Purchase[]> {
  try {
    const response = await fetch(`${WAREHOUSE_URL}/api/purchases?limit=${limit}`);
    const data = (await response.json()) as PurchasesResponse;
    return data.data?.purchases || [];
  } catch (error) {
    console.error('Error fetching recent purchases:', error);
    return [];
  }
}

export async function getWarehouseStats(): Promise<WarehouseStats | null> {
  try {
    const response = await fetch(`${WAREHOUSE_URL}/api/stats`);
    const data = (await response.json()) as StatsResponse;
    return data.data || null;
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    return null;
  }
}
