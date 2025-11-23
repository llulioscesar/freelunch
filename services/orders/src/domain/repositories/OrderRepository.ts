/**
 * Repository Interface for Order Aggregate
 * This is a PORT in hexagonal architecture
 */
import { Order } from '../entities/Order';
import { OrderId } from '../value-objects/OrderId';
import { OrderStatus } from '../value-objects/OrderStatus';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findAll(filters?: OrderFilters): Promise<Order[]>;
  count(filters?: OrderFilters): Promise<number>;
  update(order: Order): Promise<void>;
  delete(id: OrderId): Promise<void>;
  exists(id: OrderId): Promise<boolean>;
  disconnect?(): Promise<void>;
}

export interface OrderFilters {
  status?: OrderStatus;
  customerName?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}