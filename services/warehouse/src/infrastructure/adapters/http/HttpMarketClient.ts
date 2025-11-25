/**
 * Adapter: HttpMarketClient
 * HTTP client for the farmers market API
 */
import { MarketClient, MarketPurchaseResult } from '../../../application/ports/out/MarketClient';
import { logger } from '../../logging/Logger';

const MARKET_API_URL =
  process.env.MARKET_API_URL ||
  'https://recruitment.alegra.com/api/farmers-market/buy';

export class HttpMarketClient implements MarketClient {
  private readonly apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || MARKET_API_URL;
  }

  async buyIngredient(ingredient: string): Promise<MarketPurchaseResult> {
    const url = `${this.apiUrl}?ingredient=${encodeURIComponent(ingredient)}`;

    logger.info('Calling farmers market API', {
      url,
      ingredient,
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Market API returned status ${response.status}`);
      }

      const data = (await response.json()) as { quantitySold?: number };

      // The API returns { quantitySold: number }
      const quantitySold = data.quantitySold ?? 0;

      logger.info('Farmers market API response', {
        ingredient,
        quantitySold,
        success: quantitySold > 0,
      });

      return {
        ingredient,
        quantitySold,
        success: quantitySold > 0,
      };
    } catch (error) {
      logger.error('Failed to call farmers market API', error as Error, {
        url,
        ingredient,
      });

      return {
        ingredient,
        quantitySold: 0,
        success: false,
      };
    }
  }
}
