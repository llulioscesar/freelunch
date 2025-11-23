/**
 * Entity: Order
 * Representa una orden en el sistema
 */
import { OrderId } from '../value-objects/OrderId';
import { OrderStatus, OrderStatusEnum } from '../value-objects/OrderStatus';
import { Quantity } from '../value-objects/Quantity';
import { CustomerInfo } from '../value-objects/CustomerInfo';
import { OrderCreatedEvent } from '../events/OrderCreatedEvent';
import { OrderStatusChangedEvent } from '../events/OrderStatusChangedEvent';
import { OrderCompletedEvent } from '../events/OrderCompletedEvent';
import { OrderFailedEvent } from '../events/OrderFailedEvent';
import { logger } from '../../infrastructure/logging/Logger';
import { OrderItem, OrderItemStatus } from './OrderItem';
import { OrderItemId } from '../value-objects/OrderItemId';

export class Order {
  private readonly id: OrderId;
  private status: OrderStatus;
  private readonly quantity: Quantity;
  private readonly customerInfo: CustomerInfo;
  private readonly items: OrderItem[];  // Individual dishes
  private readonly createdAt: Date;
  private completedAt?: Date;
  private updatedAt: Date;
  private domainEvents: any[] = [];

  constructor(
    id: OrderId,
    quantity: Quantity,
    customerInfo: CustomerInfo,
    status?: OrderStatus,
    createdAt?: Date,
    items?: OrderItem[]
  ) {
    this.id = id;
    this.quantity = quantity;
    this.customerInfo = customerInfo;
    this.status = status || new OrderStatus(OrderStatusEnum.PENDING);
    this.createdAt = createdAt || new Date();
    this.updatedAt = new Date();

    // Initialize order items (one per dish)
    if (items) {
      this.items = items;
    } else {
      // Create N order items for N dishes
      this.items = [];
      for (let i = 0; i < quantity.getValue(); i++) {
        this.items.push(new OrderItem(new OrderItemId(), this.id));
      }
    }

    // Si es una nueva orden, emitir evento de creación
    if (!status) {
      const event = new OrderCreatedEvent(
        this.id.getValue(),
        this.quantity.getValue(),
        this.customerInfo.getName(),
        this.items.map(item => ({
          itemId: item.getId().getValue(),
          orderId: this.id.getValue(),
        }))
      );
      this.addDomainEvent(event);

      logger.logDomainEvent('order.created', this.id.getValue(), {
        quantity: this.quantity.getValue(),
        itemsCount: this.items.length,
        customerName: this.customerInfo.getName(),
      });
    }
  }

  // Getters
  getId(): OrderId {
    return this.id;
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getQuantity(): Quantity {
    return this.quantity;
  }

  getCustomerInfo(): CustomerInfo {
    return this.customerInfo;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getItems(): OrderItem[] {
    return [...this.items]; // Return copy to prevent external modification
  }

  getItemById(itemId: OrderItemId): OrderItem | undefined {
    return this.items.find(item => item.getId().equals(itemId));
  }

  // Business Methods
  updateStatus(newStatus: OrderStatusEnum): void {
    const newStatusObj = new OrderStatus(newStatus);

    if (!this.status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this.status.toString()} to ${newStatus}`
      );
    }

    const oldStatus = this.status.getValue();
    this.status = newStatusObj;
    this.updatedAt = new Date();

    if (newStatusObj.isFinal()) {
      this.completedAt = new Date();
    }

    // Emitir evento de cambio de estado
    const event = new OrderStatusChangedEvent(
      this.id.getValue(),
      oldStatus,
      newStatus
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('order.status.changed', this.id.getValue(), {
      previousStatus: oldStatus,
      newStatus,
    });
  }

  markAsPreparing(): void {
    this.updateStatus(OrderStatusEnum.PREPARING);
  }

  markAsReady(): void {
    this.updateStatus(OrderStatusEnum.READY);
  }

  markAsDelivered(): void {
    this.updateStatus(OrderStatusEnum.DELIVERED);

    // Emitir evento específico de orden completada
    const completedAt = new Date();
    const preparationTimeMinutes = Math.round(
      (completedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)
    );

    const event = new OrderCompletedEvent(
      this.id.getValue(),
      completedAt,
      preparationTimeMinutes,
      this.quantity.getValue()
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('order.completed', this.id.getValue(), {
      preparationTimeMinutes,
      quantity: this.quantity.getValue(),
    });
  }

  markAsFailed(reason?: string, errorDetails?: string): void {
    this.updateStatus(OrderStatusEnum.FAILED);

    // Emitir evento específico de orden fallida
    const event = new OrderFailedEvent(
      this.id.getValue(),
      new Date(),
      reason || 'Unknown error',
      this.quantity.getValue(),
      errorDetails
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('order.failed', this.id.getValue(), {
      reason: reason || 'Unknown error',
      errorDetails,
      quantity: this.quantity.getValue(),
    });
  }

  cancel(): void {
    if (this.status.isFinal()) {
      throw new Error('Cannot cancel a completed order');
    }
    this.updateStatus(OrderStatusEnum.CANCELLED);
  }

  // Domain Events
  addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): any[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Business Rules
  isPending(): boolean {
    return this.status.isPending();
  }

  isCompleted(): boolean {
    return this.status.isFinal();
  }

  canBeCancelled(): boolean {
    return !this.status.isFinal();
  }

  requiresUrgentAttention(): boolean {
    const minutesSinceCreation =
      (Date.now() - this.createdAt.getTime()) / (1000 * 60);
    return minutesSinceCreation > 30 && !this.isCompleted();
  }

  getEstimatedPreparationTime(): number {
    return this.quantity.calculateEstimatedPreparationTime();
  }

  // Order Items Business Rules
  getTotalItems(): number {
    return this.items.length;
  }

  getCompletedItems(): number {
    return this.items.filter(item => item.isCompleted()).length;
  }

  getPendingItems(): number {
    return this.items.filter(item => item.isPending()).length;
  }

  getReadyItems(): number {
    return this.items.filter(item => item.isReady()).length;
  }

  getFailedItems(): number {
    return this.items.filter(item => item.isFailed()).length;
  }

  isFullyCompleted(): boolean {
    return this.items.every(item => item.isCompleted());
  }

  hasFailedItems(): boolean {
    return this.items.some(item => item.isFailed());
  }

  getProgressPercentage(): number {
    if (this.items.length === 0) return 0;
    return Math.round((this.getCompletedItems() / this.items.length) * 100);
  }

  // Serialization
  toPrimitives(): any {
    return {
      id: this.id.getValue(),
      status: this.status.getValue(),
      quantity: this.quantity.getValue(),
      customerName: this.customerInfo.getName(),
      notes: this.customerInfo.getNotes(),
      items: this.items.map(item => item.toPrimitives()),
      totalItems: this.getTotalItems(),
      completedItems: this.getCompletedItems(),
      pendingItems: this.getPendingItems(),
      progress: this.getProgressPercentage(),
      createdAt: this.createdAt.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromPrimitives(data: any): Order {
    // Reconstruct OrderItems if present
    const items = data.items
      ? data.items.map((itemData: any) => OrderItem.fromPrimitives(itemData))
      : undefined;

    const order = new Order(
      new OrderId(data.id),
      new Quantity(data.quantity),
      new CustomerInfo(data.customerName, data.notes),
      new OrderStatus(data.status as OrderStatusEnum),
      new Date(data.createdAt),
      items
    );

    // Restore completedAt and updatedAt
    if (data.completedAt) {
      (order as any).completedAt = new Date(data.completedAt);
    }
    if (data.updatedAt) {
      (order as any).updatedAt = new Date(data.updatedAt);
    }

    return order;
  }
}