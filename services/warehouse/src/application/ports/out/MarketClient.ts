/**
 * Port: MarketClient
 * Interface for purchasing from the farmers market
 */
export interface MarketPurchaseResult {
  ingredient: string;
  quantitySold: number;
  success: boolean;
}

export interface MarketClient {
  /**
   * Purchase an ingredient from the farmers market
   * @param ingredient The ingredient to purchase
   * @returns The purchase result with quantity sold
   */
  buyIngredient(ingredient: string): Promise<MarketPurchaseResult>;
}
