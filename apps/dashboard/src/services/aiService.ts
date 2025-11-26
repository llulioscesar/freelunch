/**
 * AI Service Client
 */
import { apiConfig, apiFetch } from './api';
import type { AIRecommendationsResponse, ChatResponse } from '../types/api';

const BASE_URL = apiConfig.urls.ai;

/**
 * Get AI recommendations (recipe ranking and critical alerts)
 */
export async function getRecommendations(): Promise<AIRecommendationsResponse> {
  return apiFetch<AIRecommendationsResponse>(`${BASE_URL}/api/recommendations`);
}

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(`${BASE_URL}/api/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, conversationId }),
  });
}
