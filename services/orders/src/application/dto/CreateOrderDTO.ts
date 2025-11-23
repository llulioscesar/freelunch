/**
 * DTO: Create Order
 * Data Transfer Object for creating a new order
 */
export interface CreateOrderDTO {
  quantity: number;
  customerName?: string;
  notes?: string;
}

export interface CreateOrderResponseDTO {
  success: boolean;
  order: {
    id: string;
    quantity: number;
    status: string;
    customerName: string;
    createdAt: string;
  };
  message: string;
}