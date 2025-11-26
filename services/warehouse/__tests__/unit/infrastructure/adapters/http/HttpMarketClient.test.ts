import { HttpMarketClient } from '../../../../../src/infrastructure/adapters/http/HttpMarketClient';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HttpMarketClient', () => {
  let client: HttpMarketClient;

  beforeEach(() => {
    client = new HttpMarketClient('https://test-api.com/buy');
    mockFetch.mockClear();
  });

  describe('buyIngredient', () => {
    it('should call API with correct URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ quantitySold: 3 }),
      });

      await client.buyIngredient('tomato');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/buy?ingredient=tomato',
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
    });

    it('should return success result when API returns quantity', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ quantitySold: 3 }),
      });

      const result = await client.buyIngredient('tomato');

      expect(result).toEqual({
        ingredient: 'tomato',
        quantitySold: 3,
        success: true,
      });
    });

    it('should return failure result when API returns zero', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ quantitySold: 0 }),
      });

      const result = await client.buyIngredient('tomato');

      expect(result).toEqual({
        ingredient: 'tomato',
        quantitySold: 0,
        success: false,
      });
    });

    it('should handle missing quantitySold in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await client.buyIngredient('tomato');

      expect(result).toEqual({
        ingredient: 'tomato',
        quantitySold: 0,
        success: false,
      });
    });

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await client.buyIngredient('tomato');

      expect(result).toEqual({
        ingredient: 'tomato',
        quantitySold: 0,
        success: false,
      });
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await client.buyIngredient('tomato');

      expect(result).toEqual({
        ingredient: 'tomato',
        quantitySold: 0,
        success: false,
      });
    });

    it('should encode ingredient name in URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ quantitySold: 1 }),
      });

      await client.buyIngredient('ingredient with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/buy?ingredient=ingredient%20with%20spaces',
        expect.any(Object)
      );
    });
  });
});
