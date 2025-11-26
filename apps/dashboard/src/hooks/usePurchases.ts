/**
 * Purchases Hooks - TanStack Query
 */
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '../services';

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...purchaseKeys.lists(), { page, limit }] as const,
};

/**
 * Get purchase history from farmers market
 */
export function usePurchases(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: purchaseKeys.list(page, limit),
    queryFn: () => warehouseService.getPurchases(page, limit),
    refetchInterval: 10_000, // Refresh every 10 seconds
  });
}
