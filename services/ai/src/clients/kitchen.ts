import { Recipe, KitchenStats } from '../types';

const KITCHEN_URL = process.env.KITCHEN_URL || 'http://localhost:3001';

interface RecipesResponse {
  recipes?: Recipe[];
}

interface StatsResponse {
  success?: boolean;
  data?: KitchenStats;
}

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const response = await fetch(`${KITCHEN_URL}/api/recipes`);
    const data = (await response.json()) as RecipesResponse;
    return data.recipes || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

export async function getKitchenStats(): Promise<KitchenStats | null> {
  try {
    const response = await fetch(`${KITCHEN_URL}/api/stats`);
    const data = (await response.json()) as StatsResponse;
    return data.data || null;
  } catch (error) {
    console.error('Error fetching kitchen stats:', error);
    return null;
  }
}
