/**
 * Port: WarehouseClient
 * Interface for communicating with Warehouse service (Hexagonal Architecture)
 */

export interface IngredientRequest {
  ingredient: string;
  quantity: number;
}

export interface IngredientResponse {
  ingredient: string;
  requestedQuantity: number;
  availableQuantity: number;
  success: boolean;
}

export interface IngredientsRequestResult {
  plateId: string;
  allAvailable: boolean;
  ingredients: IngredientResponse[];
  totalRequested: number;
  totalAvailable: number;
}

export interface WarehouseClient {
  /**
   * Request ingredients from warehouse
   */
  requestIngredients(
    plateId: string,
    ingredients: Map<string, number>
  ): Promise<IngredientsRequestResult>;

  /**
   * Check ingredient availability without reserving
   */
  checkAvailability(ingredientName: string): Promise<number>;

  /**
   * Get warehouse health status
   */
  healthCheck(): Promise<boolean>;
}
