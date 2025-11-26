/**
 * Recipes Hooks - TanStack Query
 */
import { useQuery } from '@tanstack/react-query';
import { kitchenService } from '../services';

export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
};

/**
 * Get all available recipes
 */
export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: () => kitchenService.getRecipes(),
    staleTime: 60_000, // Recipes don't change often
  });
}
