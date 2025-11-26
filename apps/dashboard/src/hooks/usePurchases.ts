/**
 * Purchases Hooks - TanStack Query
 */
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '../services';

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (limit?: number) => [...purchaseKeys.lists(), { limit }] as const,
};

/**
 * Get purchase history from farmers market
 */
export function usePurchases(limit?: number) {
  return useQuery({
    queryKey: purchaseKeys.list(limit),
    queryFn: () => warehouseService.getPurchases(limit),
    refetchInterval: 10_000, // Refresh every 10 seconds
  });
}
