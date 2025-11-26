import { buildChatSystemPrompt, buildChatPrompt } from '../../../src/prompts/chat';
import { SystemContext } from '../../../src/types';

describe('Chat Prompts', () => {
  const baseContext: SystemContext = {
    inventory: [],
    recipes: [],
    purchaseStats: { total: 0, successful: 0, failed: 0 },
    recentFailedPurchases: [],
  };

  describe('buildChatSystemPrompt', () => {
    it('should include inventory in system prompt', () => {
      const context: SystemContext = {
        ...baseContext,
        inventory: [
          { id: '1', ingredientName: 'tomato', quantity: 5 },
        ],
      };

      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('tomato');
      expect(prompt).toContain('5');
    });

    it('should include recipes in system prompt', () => {
      const context: SystemContext = {
        ...baseContext,
        recipes: [
          { id: '1', name: 'Pizza', ingredients: { cheese: 2 } },
        ],
      };

      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Pizza');
    });

    it('should calculate success rate', () => {
      const context: SystemContext = {
        ...baseContext,
        purchaseStats: { total: 100, successful: 80, failed: 20 },
      };

      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('80%');
    });

    it('should handle zero total purchases', () => {
      const prompt = buildChatSystemPrompt(baseContext);

      expect(prompt).toContain('0%');
    });

    it('should include problematic ingredients', () => {
      const context: SystemContext = {
        ...baseContext,
        recentFailedPurchases: ['tomato', 'cheese'],
      };

      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('tomato');
      expect(prompt).toContain('cheese');
    });

    it('should show "Ninguno" when no problematic ingredients', () => {
      const prompt = buildChatSystemPrompt(baseContext);

      expect(prompt).toContain('Ninguno');
    });
  });

  describe('buildChatPrompt', () => {
    it('should combine system prompt and user message', () => {
      const systemPrompt = 'System context here';
      const userMessage = 'What can I cook?';

      const prompt = buildChatPrompt(systemPrompt, userMessage);

      expect(prompt).toContain(systemPrompt);
      expect(prompt).toContain(userMessage);
      expect(prompt).toContain('PREGUNTA DEL USUARIO');
    });
  });
});
