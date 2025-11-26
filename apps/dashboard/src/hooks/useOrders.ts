/**
 * Orders Hooks - TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
};

/**
 * Get order statistics for dashboard
 */
export function useStats() {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: () => ordersService.getStats(),
    refetchInterval: 5_000, // Refresh every 5 seconds for real-time feel
  });
}

/**
 * Get all orders
 */
export function useOrders() {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: () => ordersService.getAll(),
    refetchInterval: 5_000,
  });
}

/**
 * Get a single order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersService.getById(id),
    enabled: !!id,
  });
}

/**
 * Create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      quantity,
      customerName,
      notes,
    }: {
      quantity: number;
      customerName?: string;
      notes?: string;
    }) => ordersService.create(quantity, customerName, notes),
    onSuccess: () => {
      // Invalidate orders and stats queries
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
