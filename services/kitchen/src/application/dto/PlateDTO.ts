/**
 * DTO: Plate
 * Data Transfer Object for Plate responses
 */

export interface PlateDTO {
  id: string;
  orderId: string;
  orderItemId: string;
  recipeId?: string;
  recipeName?: string;
  ingredients?: Record<string, number>;
  status: string;
  createdAt: string;
  assignedAt?: string;
  cookingAt?: string;
  readyAt?: string;
  failureReason?: string;
  retryCount: number;
  preparationTime?: number | null;
}

export interface GetPlateResponseDTO {
  success: boolean;
  plate: PlateDTO;
}

export interface ListPlatesResponseDTO {
  success: boolean;
  plates: PlateDTO[];
  total: number;
  stats?: {
    pending: number;
    assigned: number;
    requesting: number;
    cooking: number;
    ready: number;
    failed: number;
  };
}
