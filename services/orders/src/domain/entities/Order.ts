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

export class Order {
  private readonly id: OrderId;
  private status: OrderStatus;
  private readonly quantity: Quantity;
  private readonly customerInfo: CustomerInfo;
  private readonly createdAt: Date;
  private completedAt?: Date;
  private updatedAt: Date;
  private domainEvents: any[] = [];

  constructor(
    id: OrderId,
    quantity: Quantity,
    customerInfo: CustomerInfo,
    status?: OrderStatus,
    createdAt?: Date
  ) {
    this.id = id;
    this.quantity = quantity;
    this.customerInfo = customerInfo;
    this.status = status || new OrderStatus(OrderStatusEnum.PENDING);
    this.createdAt = createdAt || new Date();
    this.updatedAt = new Date();

    // Si es una nueva orden, emitir evento de creación
    if (!status) {
      this.addDomainEvent(
        new OrderCreatedEvent(
          this.id.getValue(),
          this.quantity.getValue(),
          this.customerInfo.getName()
        )
      );
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
    this.addDomainEvent(
      new OrderStatusChangedEvent(
        this.id.getValue(),
        oldStatus,
        newStatus
      )
    );
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

    this.addDomainEvent(
      new OrderCompletedEvent(
        this.id.getValue(),
        completedAt,
        preparationTimeMinutes,
        this.quantity.getValue()
      )
    );
  }

  markAsFailed(reason?: string, errorDetails?: string): void {
    this.updateStatus(OrderStatusEnum.FAILED);

    // Emitir evento específico de orden fallida
    this.addDomainEvent(
      new OrderFailedEvent(
        this.id.getValue(),
        new Date(),
        reason || 'Unknown error',
        this.quantity.getValue(),
        errorDetails
      )
    );
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

  // Serialization
  toPrimitives(): any {
    return {
      id: this.id.getValue(),
      status: this.status.getValue(),
      quantity: this.quantity.getValue(),
      customerName: this.customerInfo.getName(),
      notes: this.customerInfo.getNotes(),
      createdAt: this.createdAt.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromPrimitives(data: any): Order {
    return new Order(
      new OrderId(data.id),
      new Quantity(data.quantity),
      new CustomerInfo(data.customerName, data.notes),
      new OrderStatus(data.status as OrderStatusEnum),
      new Date(data.createdAt)
    );
  }
}