/**
 * Port: WarehouseClient
 * Interface for communicating with Warehouse service via Redis Streams
 *
 * Pattern: Asynchronous communication through events
 * - Kitchen publishes to warehouse:requests stream
 * - Kitchen consumes from warehouse:responses stream
 */

export interface IngredientsRequestPayload {
  plateId: string;
  orderItemId: string;
  recipeId: string;
  recipeName: string;
  ingredients: Record<string, number>;
  requestedAt: string;
}

export interface IngredientsResponsePayload {
  plateId: string;
  orderItemId: string;
  success: boolean;
  ingredients: Record<string, number>;
  availableIngredients?: Record<string, number>;
  unavailableIngredients?: string[];
  message?: string;
  processedAt: string;
}

export interface WarehouseClient {
  /**
   * Request ingredients from warehouse (async via Redis Streams)
   * Publishes event to warehouse:requests stream
   */
  requestIngredients(payload: IngredientsRequestPayload): Promise<void>;

  /**
   * Initialize consumer to listen for warehouse responses
   * Consumes from warehouse:responses stream
   */
  initialize(): Promise<void>;

  /**
   * Start consuming responses from warehouse
   */
  startConsuming(): Promise<void>;

  /**
   * Stop consuming
   */
  stopConsuming(): Promise<void>;
}
