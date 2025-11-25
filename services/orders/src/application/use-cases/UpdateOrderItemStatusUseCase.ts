/**
 * Use Case: Update Order Item Status
 *
 * Updates the status of an individual dish (OrderItem) within an order.
 * This is typically called when Kitchen Service publishes events about dish progress.
 *
 * Events that trigger this:
 * - RECIPE_ASSIGNED: Kitchen selected a recipe for this dish
 * - DISH_PREPARING: Kitchen started preparing
 * - DISH_PREPARED: Dish is ready
 * - DISH_FAILED: Dish preparation failed
 */
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { StatusHistoryRepository } from '../../domain/repositories/StatusHistoryRepository';
import { OrderId } from '../../domain/value-objects/OrderId';
import { OrderItemId } from '../../domain/value-objects/OrderItemId';
import { OrderItemStatus } from '../../domain/entities/OrderItem';
import { EventPublisher } from '../ports/out/EventPublisher';
import { logger } from '../../infrastructure/logging/Logger';
import { metricsService } from '../../infrastructure/metrics/MetricsService';

export interface UpdateOrderItemStatusDTO {
  orderId: string;
  itemId: string;
  status: OrderItemStatus;
  recipeId?: string;
  recipeName?: string;
  failureReason?: string;
}

export interface UpdateOrderItemStatusResponseDTO {
  success: boolean;
  order?: {
    id: string;
    status: string;
    totalItems: number;
    completedItems: number;
    progress: number;
  };
  item?: {
    id: string;
    status: string;
    recipeId?: string;
    recipeName?: string;
  };
  error?: string;
}

export class UpdateOrderItemStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly statusHistoryRepository?: StatusHistoryRepository
  ) {}

  async execute(dto: UpdateOrderItemStatusDTO): Promise<UpdateOrderItemStatusResponseDTO> {
    const startTime = Date.now();
    const useCaseName = 'UpdateOrderItemStatus';

    logger.logUseCaseStart(useCaseName, {
      orderId: dto.orderId,
      itemId: dto.itemId,
      status: dto.status,
    });

    try {
      // 1. Find the order
      const orderId = new OrderId(dto.orderId);
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        logger.warn('Order not found', { orderId: dto.orderId });
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // 2. Find the item within the order
      const itemId = new OrderItemId(dto.itemId);
      const item = order.getItemById(itemId);

      if (!item) {
        logger.warn('OrderItem not found', {
          orderId: dto.orderId,
          itemId: dto.itemId,
        });
        return {
          success: false,
          error: 'Order item not found',
        };
      }

      // Capture previous status for history
      const previousStatus = item.getStatus();

      logger.debug('Found order item, current state', {
        itemId: dto.itemId,
        currentStatus: previousStatus,
        targetStatus: dto.status,
        recipeId: item.getRecipeId(),
        recipeName: item.getRecipeName(),
      });

      // 3. Update item status based on event
      switch (dto.status) {
        case OrderItemStatus.ASSIGNED:
          if (dto.recipeId && dto.recipeName) {
            item.assignRecipe(dto.recipeId, dto.recipeName);
            logger.info('Recipe assigned to order item', {
              itemId: dto.itemId,
              recipeId: dto.recipeId,
              recipeName: dto.recipeName,
            });
          }
          break;

        case OrderItemStatus.PREPARING:
          item.markAsPreparing();
          break;

        case OrderItemStatus.INGREDIENTS_REQUESTED:
          item.markAsIngredientsRequested();
          break;

        case OrderItemStatus.COOKING:
          item.markAsCooking();
          break;

        case OrderItemStatus.READY:
          item.markAsReady();
          logger.info('Dish prepared successfully', {
            itemId: dto.itemId,
            recipeId: item.getRecipeId(),
            preparationTime: item.getPreparationTime(),
          });
          break;

        case OrderItemStatus.DELIVERED:
          item.markAsDelivered();
          break;

        case OrderItemStatus.FAILED:
          item.markAsFailed(dto.failureReason || 'Unknown error');
          logger.warn('Dish preparation failed', {
            itemId: dto.itemId,
            reason: dto.failureReason,
          });
          break;

        default:
          logger.warn('Unknown item status', { status: dto.status });
          return {
            success: false,
            error: `Unknown status: ${dto.status}`,
          };
      }

      // 4. Record status change in history
      if (this.statusHistoryRepository && previousStatus !== dto.status) {
        try {
          await this.statusHistoryRepository.record({
            orderItemId: dto.itemId,
            fromStatus: previousStatus,
            toStatus: dto.status,
            recipeId: dto.recipeId || item.getRecipeId(),
            recipeName: dto.recipeName || item.getRecipeName(),
            reason: dto.failureReason,
          });
          logger.debug('Status history recorded', {
            itemId: dto.itemId,
            fromStatus: previousStatus,
            toStatus: dto.status,
          });
        } catch (historyError) {
          // Don't fail the main operation if history recording fails
          logger.warn('Failed to record status history', {
            itemId: dto.itemId,
            error: (historyError as Error).message,
          });
        }
      }

      // 5. Check if order should be auto-completed
      this.checkAndCompleteOrder(order);

      // 6. Save updated order
      await this.orderRepository.update(order);

      logger.logRepositoryOperation('update', 'Order', orderId.getValue());

      // 6. Publish domain events if order completed
      const events = order.getDomainEvents();
      if (events.length > 0) {
        for (const event of events) {
          await this.eventPublisher.publish(event);
        }
        order.clearDomainEvents();

        logger.info(`Published ${events.length} domain events`, {
          orderId: dto.orderId,
        });
      }

      const duration = Date.now() - startTime;
      logger.logUseCaseEnd(useCaseName, duration, {
        orderId: dto.orderId,
        itemId: dto.itemId,
      });

      // Record metrics
      const durationSeconds = duration / 1000;
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, true);

      // Record item metrics based on status
      if (dto.status === OrderItemStatus.READY && item.getPreparedAt()) {
        const prepTime = item.getPreparationTime();
        if (prepTime !== null) {
          metricsService.recordOrderItemCompleted(
            item.getRecipeName() || 'unknown',
            prepTime
          );
        }
      } else if (dto.status === OrderItemStatus.FAILED) {
        metricsService.recordOrderItemFailed(item.getRecipeName());
      }

      return {
        success: true,
        order: {
          id: order.getId().getValue(),
          status: order.getStatus().getValue(),
          totalItems: order.getTotalItems(),
          completedItems: order.getCompletedItems(),
          progress: order.getProgressPercentage(),
        },
        item: {
          id: item.getId().getValue(),
          status: item.getStatus(),
          recipeId: item.getRecipeId(),
          recipeName: item.getRecipeName(),
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, false);

      logger.logUseCaseError(useCaseName, error, {
        orderId: dto.orderId,
        itemId: dto.itemId,
      });

      return {
        success: false,
        error: error.message || 'Failed to update order item status',
      };
    }
  }

  /**
   * Auto-update order status based on item states
   *
   * Order status progression:
   * - PENDING → PREPARING: When any item starts (assigned/cooking)
   * - PREPARING → READY: When all items are ready
   * - READY → DELIVERED: When all items are delivered
   * - Any → FAILED: When items fail
   */
  private checkAndCompleteOrder(order: any): void {
    const currentStatus = order.getStatus().getValue();

    // Check for failures first
    if (order.hasFailedItems() && !order.isCompleted()) {
      order.markAsFailed('Some dishes failed to prepare');
      logger.info('Order marked as failed (some items failed)', {
        orderId: order.getId().getValue(),
        failedItems: order.getFailedItems(),
        totalItems: order.getTotalItems(),
      });
      return;
    }

    // All items delivered → Order DELIVERED
    if (order.areAllItemsDelivered() && currentStatus !== 'DELIVERED') {
      order.markAsDelivered();
      logger.info('Order marked as delivered (all items delivered)', {
        orderId: order.getId().getValue(),
        totalItems: order.getTotalItems(),
      });
      return;
    }

    // All items ready → Order READY
    if (order.areAllItemsReady() && currentStatus !== 'READY' && currentStatus !== 'DELIVERED') {
      order.markAsReady();
      logger.info('Order marked as ready (all items ready)', {
        orderId: order.getId().getValue(),
        totalItems: order.getTotalItems(),
        readyItems: order.getReadyItems(),
      });
      return;
    }

    // Any item in progress → Order PREPARING
    if (order.hasAnyItemInProgress() && currentStatus === 'PENDING') {
      order.markAsPreparing();
      logger.info('Order marked as preparing (items in progress)', {
        orderId: order.getId().getValue(),
        pendingItems: order.getPendingItems(),
        totalItems: order.getTotalItems(),
      });
    }
  }
}
