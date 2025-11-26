import { useState, useEffect, useCallback } from 'react';
import { getRecommendations } from '../services/aiService';
import type { AIRecommendations } from '../types/api';

interface UseRecommendationsResult {
  recommendations: AIRecommendations | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecommendations(): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRecommendations();
      if (response.success && response.data) {
        setRecommendations(response.data);
      } else {
        setError('Failed to fetch recommendations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}
