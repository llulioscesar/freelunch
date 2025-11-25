/**
 * DTO: PurchaseDTO
 * Data transfer object for purchase
 */
export interface PurchaseDTO {
  id: string;
  ingredientName: string;
  requestedQuantity: number;
  obtainedQuantity: number;
  status: 'pending' | 'completed' | 'failed';
  plateId: string | null;
  orderId: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PurchaseHistoryDTO {
  purchases: PurchaseDTO[];
  total: number;
  successful: number;
  failed: number;
}
