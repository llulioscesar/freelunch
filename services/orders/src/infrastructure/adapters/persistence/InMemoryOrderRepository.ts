/**
 * Adapter: In-Memory Order Repository
 * For testing and development purposes
 */
import { OrderRepository, OrderFilters } from '../../../domain/repositories/OrderRepository';
import { Order } from '../../../domain/entities/Order';
import { OrderId } from '../../../domain/value-objects/OrderId';

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();

  async save(order: Order): Promise<void> {
    this.orders.set(order.getId().getValue(), order);
  }

  async findById(id: OrderId): Promise<Order | null> {
    return this.orders.get(id.getValue()) || null;
  }

  async findAll(filters?: OrderFilters): Promise<Order[]> {
    let orders = Array.from(this.orders.values());

    // Apply filters
    if (filters?.status) {
      orders = orders.filter(o =>
        o.getStatus().equals(filters.status!)
      );
    }

    if (filters?.customerName) {
      orders = orders.filter(o =>
        o.getCustomerInfo().getName()
          .toLowerCase()
          .includes(filters.customerName!.toLowerCase())
      );
    }

    if (filters?.fromDate) {
      orders = orders.filter(o =>
        o.getCreatedAt() >= filters.fromDate!
      );
    }

    if (filters?.toDate) {
      orders = orders.filter(o =>
        o.getCreatedAt() <= filters.toDate!
      );
    }

    // Sort
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';
    orders.sort((a, b) => {
      const aValue = sortBy === 'createdAt' ? a.getCreatedAt() : a.getUpdatedAt();
      const bValue = sortBy === 'createdAt' ? b.getCreatedAt() : b.getUpdatedAt();

      if (sortOrder === 'asc') {
        return aValue.getTime() - bValue.getTime();
      } else {
        return bValue.getTime() - aValue.getTime();
      }
    });

    // Pagination
    const offset = filters?.offset || 0;
    const limit = filters?.limit || orders.length;
    return orders.slice(offset, offset + limit);
  }

  async count(filters?: OrderFilters): Promise<number> {
    const orders = await this.findAll(filters);
    return orders.length;
  }

  async update(order: Order): Promise<void> {
    this.orders.set(order.getId().getValue(), order);
  }

  async delete(id: OrderId): Promise<void> {
    this.orders.delete(id.getValue());
  }

  async exists(id: OrderId): Promise<boolean> {
    return this.orders.has(id.getValue());
  }

  // Testing helper methods
  clear(): void {
    this.orders.clear();
  }

  size(): number {
    return this.orders.size;
  }
}