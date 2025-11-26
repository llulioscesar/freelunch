/**
 * Use Case: Get Order Stats
 * Returns statistics about orders and items for the dashboard
 */
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderStatusEnum } from '../../domain/value-objects/OrderStatus';
import { OrderItemStatus } from '../../domain/entities/OrderItem';
import { logger } from '../../infrastructure/logging/Logger';

export interface OrderStatsDTO {
  orders: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  items: {
    total: number;
    pending: number;
    preparing: number;
    ready: number;
    delivered: number;
    failed: number;
  };
  summary: {
    activeOrders: number;
    platesDelivered: number;
    platesInProgress: number;
  };
}

export class GetOrderStatsUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(): Promise<OrderStatsDTO> {
    logger.debug('Getting order statistics');

    const orders = await this.orderRepository.findAll();

    // Order stats
    const orderStats = {
      total: orders.length,
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    // Item stats
    const itemStats = {
      total: 0,
      pending: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      failed: 0,
    };

    for (const order of orders) {
      const status = order.getStatus().getValue();

      // Count order statuses
      if (status === OrderStatusEnum.DELIVERED) {
        orderStats.completed++;
      } else if (status === OrderStatusEnum.FAILED) {
        orderStats.failed++;
      } else if (status === OrderStatusEnum.CANCELLED) {
        orderStats.cancelled++;
      } else {
        orderStats.active++;
      }

      // Count item statuses
      const items = order.getItems();
      itemStats.total += items.length;

      for (const item of items) {
        const itemStatus = item.getStatus();

        switch (itemStatus) {
          case OrderItemStatus.PENDING:
            itemStats.pending++;
            break;
          case OrderItemStatus.ASSIGNED:
          case OrderItemStatus.PREPARING:
          case OrderItemStatus.INGREDIENTS_REQUESTED:
          case OrderItemStatus.COOKING:
            itemStats.preparing++;
            break;
          case OrderItemStatus.READY:
            itemStats.ready++;
            break;
          case OrderItemStatus.DELIVERED:
            itemStats.delivered++;
            break;
          case OrderItemStatus.FAILED:
            itemStats.failed++;
            break;
        }
      }
    }

    const stats: OrderStatsDTO = {
      orders: orderStats,
      items: itemStats,
      summary: {
        activeOrders: orderStats.active,
        platesDelivered: itemStats.delivered,
        platesInProgress: itemStats.preparing + itemStats.ready,
      },
    };

    logger.info('Order statistics retrieved', {
      totalOrders: orderStats.total,
      activeOrders: orderStats.active,
      totalItems: itemStats.total,
    });

    return stats;
  }
}
