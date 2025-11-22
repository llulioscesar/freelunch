/**
 * Use Case: List Orders
 * Business logic for listing orders with filters and pagination
 */
import { OrderRepository, OrderFilters } from '../../domain/repositories/OrderRepository';
import { OrderStatus, OrderStatusEnum } from '../../domain/value-objects/OrderStatus';

export interface ListOrdersDTO {
  page?: number;
  limit?: number;
  status?: string;
  customerName?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListOrdersResponseDTO {
  success: boolean;
  data: Array<{
    id: string;
    status: string;
    quantity: number;
    customerName: string;
    createdAt: string;
    completedAt?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ListOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(dto: ListOrdersDTO): Promise<ListOrdersResponseDTO> {
    try {
      const page = dto.page || 1;
      const limit = dto.limit || 10;
      const offset = (page - 1) * limit;

      // Build filters
      const filters: OrderFilters = {
        limit,
        offset,
        sortBy: dto.sortBy || 'createdAt',
        sortOrder: dto.sortOrder || 'desc',
      };

      if (dto.status) {
        filters.status = new OrderStatus(dto.status as OrderStatusEnum);
      }

      if (dto.customerName) {
        filters.customerName = dto.customerName;
      }

      if (dto.fromDate) {
        filters.fromDate = new Date(dto.fromDate);
      }

      if (dto.toDate) {
        filters.toDate = new Date(dto.toDate);
      }

      // Get orders and count
      const [orders, total] = await Promise.all([
        this.orderRepository.findAll(filters),
        this.orderRepository.count(filters),
      ]);

      // Map to response DTO
      return {
        success: true,
        data: orders.map((order) => ({
          id: order.getId().getValue(),
          status: order.getStatus().getValue(),
          quantity: order.getQuantity().getValue(),
          customerName: order.getCustomerInfo().getName(),
          createdAt: order.getCreatedAt().toISOString(),
          completedAt: order.getCompletedAt()?.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Error listing orders:', error);
      throw error;
    }
  }
}