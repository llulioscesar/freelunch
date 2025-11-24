/**
 * DTO: Process Order
 * Data Transfer Object for processing orders from Orders service
 */

export interface OrderItemDTO {
  itemId: string;
  orderId: string;
}

export interface ProcessOrderDTO {
  orderId: string;
  items: OrderItemDTO[];
  quantity: number;
  customerName?: string;
}

export interface ProcessOrderResponseDTO {
  success: boolean;
  orderId: string;
  platesCreated: number;
  plates: {
    plateId: string;
    orderItemId: string;
    status: string;
  }[];
  message: string;
}
