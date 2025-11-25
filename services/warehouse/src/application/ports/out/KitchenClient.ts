/**
 * Port: KitchenClient
 * Interface for responding to kitchen service
 */
import { IngredientsResponseDTO } from '../../dto/IngredientsRequestDTO';

export interface KitchenClient {
  /**
   * Send ingredient response back to kitchen
   */
  sendIngredientsResponse(response: IngredientsResponseDTO): Promise<void>;
}
