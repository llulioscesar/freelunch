import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSystemContext } from '../src/context';
import { buildRecommendationsPrompt } from '../src/prompts/recommendations';
import { generateJSON } from '../src/clients/gemini';
import { withCors } from '../src/middleware/cors';
import { RecommendationsResponse, RecipeRecommendation, CriticalAlert } from '../src/types';

interface GeminiRecommendationsResponse {
  recipeRanking: RecipeRecommendation[];
  criticalAlerts: CriticalAlert[];
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const startTime = Date.now();

    // Build context from other services
    const context = await buildSystemContext();

    // Generate recommendations using Gemini
    const prompt = buildRecommendationsPrompt(context);
    const recommendations = await generateJSON<GeminiRecommendationsResponse>(prompt);

    const duration = Date.now() - startTime;

    if (!recommendations) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations',
      });
    }

    const response: RecommendationsResponse = {
      recipeRanking: recommendations.recipeRanking || [],
      criticalAlerts: recommendations.criticalAlerts || [],
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: response,
      meta: {
        duration,
        contextSize: {
          inventory: context.inventory.length,
          recipes: context.recipes.length,
        },
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export default withCors(handler);
