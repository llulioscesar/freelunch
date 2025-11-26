import { buildRecommendationsPrompt } from '../../../src/prompts/recommendations';
import { SystemContext } from '../../../src/types';

describe('Recommendations Prompt', () => {
  const baseContext: SystemContext = {
    inventory: [],
    recipes: [],
    purchaseStats: { total: 0, successful: 0, failed: 0 },
    recentFailedPurchases: [],
  };

  describe('buildRecommendationsPrompt', () => {
    it('should include inventory items in prompt', () => {
      const context: SystemContext = {
        ...baseContext,
        inventory: [
          { id: '1', ingredientName: 'tomato', quantity: 5 },
          { id: '2', ingredientName: 'cheese', quantity: 3 },
        ],
      };

      const prompt = buildRecommendationsPrompt(context);

      expect(prompt).toContain('tomato: 5 unidades');
      expect(prompt).toContain('cheese: 3 unidades');
    });

    it('should include recipes in prompt', () => {
      const context: SystemContext = {
        ...baseContext,
        recipes: [
          { id: '1', name: 'Pizza', ingredients: { cheese: 2, tomato: 1 } },
        ],
      };

      const prompt = buildRecommendationsPrompt(context);

      expect(prompt).toContain('Pizza');
      expect(prompt).toContain('cheese');
      expect(prompt).toContain('tomato');
    });

    it('should include purchase stats in prompt', () => {
      const context: SystemContext = {
        ...baseContext,
        purchaseStats: { total: 100, successful: 90, failed: 10 },
      };

      const prompt = buildRecommendationsPrompt(context);

      expect(prompt).toContain('100');
      expect(prompt).toContain('90');
      expect(prompt).toContain('10');
    });

    it('should include failed purchases in prompt', () => {
      const context: SystemContext = {
        ...baseContext,
        recentFailedPurchases: ['tomato', 'cheese'],
      };

      const prompt = buildRecommendationsPrompt(context);

      expect(prompt).toContain('tomato');
      expect(prompt).toContain('cheese');
    });

    it('should show "Ninguna" when no failed purchases', () => {
      const prompt = buildRecommendationsPrompt(baseContext);

      expect(prompt).toContain('Ninguna');
    });

    it('should include JSON structure instructions', () => {
      const prompt = buildRecommendationsPrompt(baseContext);

      expect(prompt).toContain('recipeRanking');
      expect(prompt).toContain('criticalAlerts');
      expect(prompt).toContain('viability');
      expect(prompt).toContain('urgency');
    });
  });
});
