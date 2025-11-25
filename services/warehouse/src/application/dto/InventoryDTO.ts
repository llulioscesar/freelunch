/**
 * DTO: InventoryDTO
 * Data transfer object for inventory item
 */
export interface InventoryItemDTO {
  id: string;
  ingredientName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDTO {
  items: InventoryItemDTO[];
  totalItems: number;
  lastUpdated: string;
}
