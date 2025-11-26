/**
 * API Configuration and Base Client
 */

// API Base URLs - Configure for your environment
const API_URLS = {
  orders: import.meta.env.VITE_ORDERS_API_URL || 'https://freelunch-orders-stg.juliocaicedo.com',
  kitchen: import.meta.env.VITE_KITCHEN_API_URL || 'https://freelunch-kitchen-stg.juliocaicedo.com',
  warehouse: import.meta.env.VITE_WAREHOUSE_API_URL || 'https://freelunch-warehouse-stg.juliocaicedo.com',
  ai: import.meta.env.VITE_AI_API_URL || 'https://freelunch-ai-stg.juliocaicedo.com',
};

// Vercel Protection Bypass for preview environments
const VERCEL_PROTECTION_BYPASS = import.meta.env.VITE_VERCEL_PROTECTION_BYPASS;

export const apiConfig = {
  urls: API_URLS,
};

/**
 * Base fetch wrapper with error handling
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Add Vercel protection bypass header for preview environments
  if (VERCEL_PROTECTION_BYPASS) {
    (headers as Record<string, string>)['x-vercel-protection-bypass'] = VERCEL_PROTECTION_BYPASS;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
