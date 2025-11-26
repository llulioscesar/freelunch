/**
 * Inventory Hooks - TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from '../services';

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: () => [...inventoryKeys.all, 'list'] as const,
};

/**
 * Get current inventory
 */
export function useInventory() {
  return useQuery({
    queryKey: inventoryKeys.list(),
    queryFn: () => warehouseService.getInventory(),
    refetchInterval: 10_000, // Refresh every 10 seconds
  });
}

/**
 * Initialize inventory with default stock
 */
export function useInitializeInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => warehouseService.initializeInventory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
