/**
 * AI Service Client
 */
import { apiConfig, apiFetch } from './api';
import type { AIRecommendationsResponse } from '../types/api';

const BASE_URL = apiConfig.urls.ai;

/**
 * Get AI recommendations (recipe ranking and critical alerts)
 */
export async function getRecommendations(): Promise<AIRecommendationsResponse> {
  return apiFetch<AIRecommendationsResponse>(`${BASE_URL}/api/recommendations`);
}
