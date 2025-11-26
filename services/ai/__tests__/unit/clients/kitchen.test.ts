import { getRecipes, getKitchenStats } from '../../../src/clients/kitchen';

// Mock global fetch
global.fetch = jest.fn();

describe('Kitchen Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecipes', () => {
    it('should return recipes', async () => {
      const mockRecipes = [
        { id: '1', name: 'Pizza', ingredients: { cheese: 2, tomato: 1 } },
        { id: '2', name: 'Salad', ingredients: { lettuce: 1, tomato: 2 } },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ recipes: mockRecipes }),
      });

      const result = await getRecipes();
      expect(result).toEqual(mockRecipes);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/recipes'));
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getRecipes();
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should return empty array when no recipes in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await getRecipes();
      expect(result).toEqual([]);
    });
  });

  describe('getKitchenStats', () => {
    it('should return kitchen stats', async () => {
      const mockStats = {
        plates: { total: 50, byStatus: { READY: 40, FAILED: 10 } },
        recipes: { mostPrepared: [{ recipeName: 'Pizza', total: 20, ready: 18, failed: 2, successRate: 90 }], totalRecipes: 5 },
        failures: { total: 10, byReason: [{ reason: 'Missing ingredient', count: 5 }] },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, data: mockStats }),
      });

      const result = await getKitchenStats();
      expect(result).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/stats'));
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getKitchenStats();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
