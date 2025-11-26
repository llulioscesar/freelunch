/**
 * Kitchen Service - API Client
 */
import { apiConfig, apiFetch } from './api';
import type { RecipesResponse } from '../types/api';

const BASE_URL = apiConfig.urls.kitchen;

export const kitchenService = {
  /**
   * Get all available recipes
   */
  async getRecipes(): Promise<RecipesResponse> {
    return apiFetch<RecipesResponse>(`${BASE_URL}/api/recipes`);
  },
};
