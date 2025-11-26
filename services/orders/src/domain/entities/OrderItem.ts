/**
 * Entity: Order Item
 * Represents a single dish/plate within an order
 *
 * An Order can have multiple OrderItems (e.g., order 5 plates)
 * Each OrderItem represents one plate that needs to be prepared
 */
import { OrderItemId } from '../value-objects/OrderItemId';
import { OrderId } from '../value-objects/OrderId';

export enum OrderItemStatus {
  PENDING = 'PENDING',           // Created, waiting for recipe assignment
  ASSIGNED = 'ASSIGNED',         // Recipe selected by kitchen
  PREPARING = 'PREPARING',       // Kitchen is preparing
  INGREDIENTS_REQUESTED = 'INGREDIENTS_REQUESTED', // Waiting for ingredients
  COOKING = 'COOKING',           // Ingredients received, cooking
  READY = 'READY',              // Plate prepared and ready
  DELIVERED = 'DELIVERED',      // Delivered to customer
  FAILED = 'FAILED'             // Preparation failed
}

export class OrderItem {
  private readonly id: OrderItemId;
  private readonly orderId: OrderId;
  private recipeId?: string;
  private recipeName?: string;
  private status: OrderItemStatus;
  private readonly createdAt: Date;
  private assignedAt?: Date;
  private preparedAt?: Date;
  private deliveredAt?: Date;
  private failureReason?: string;

  constructor(
    id: OrderItemId,
    orderId: OrderId,
    status: OrderItemStatus = OrderItemStatus.PENDING,
    createdAt?: Date
  ) {
    this.id = id;
    this.orderId = orderId;
    this.status = status;
    this.createdAt = createdAt || new Date();
  }

  // Getters
  getId(): OrderItemId {
    return this.id;
  }

  getOrderId(): OrderId {
    return this.orderId;
  }

  getRecipeId(): string | undefined {
    return this.recipeId;
  }

  getRecipeName(): string | undefined {
    return this.recipeName;
  }

  getStatus(): OrderItemStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getAssignedAt(): Date | undefined {
    return this.assignedAt;
  }

  getPreparedAt(): Date | undefined {
    return this.preparedAt;
  }

  getDeliveredAt(): Date | undefined {
    return this.deliveredAt;
  }

  getFailureReason(): string | undefined {
    return this.failureReason;
  }

  // Business Methods
  assignRecipe(recipeId: string, recipeName: string): void {
    if (this.status !== OrderItemStatus.PENDING) {
      throw new Error('Can only assign recipe to pending items');
    }

    this.recipeId = recipeId;
    this.recipeName = recipeName;
    this.status = OrderItemStatus.ASSIGNED;
    this.assignedAt = new Date();
  }

  markAsPreparing(): void {
    if (this.status !== OrderItemStatus.ASSIGNED) {
      throw new Error('Item must be assigned before preparing');
    }

    this.status = OrderItemStatus.PREPARING;
  }

  markAsIngredientsRequested(): void {
    // Allow transition from ASSIGNED or PREPARING to INGREDIENTS_REQUESTED
    if (this.status !== OrderItemStatus.ASSIGNED && this.status !== OrderItemStatus.PREPARING) {
      throw new Error('Item must be assigned or preparing to request ingredients');
    }

    this.status = OrderItemStatus.INGREDIENTS_REQUESTED;
  }

  markAsCooking(): void {
    if (this.status !== OrderItemStatus.INGREDIENTS_REQUESTED) {
      throw new Error('Ingredients must be requested before cooking');
    }

    this.status = OrderItemStatus.COOKING;
  }

  markAsReady(): void {
    if (this.status !== OrderItemStatus.COOKING) {
      throw new Error('Item must be cooking to mark as ready');
    }

    this.status = OrderItemStatus.READY;
    this.preparedAt = new Date();
  }

  markAsDelivered(): void {
    if (this.status !== OrderItemStatus.READY) {
      throw new Error('Item must be ready to deliver');
    }

    this.status = OrderItemStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  markAsFailed(reason: string): void {
    this.status = OrderItemStatus.FAILED;
    this.failureReason = reason;
  }

  // Business Rules
  isPending(): boolean {
    return this.status === OrderItemStatus.PENDING;
  }

  isReady(): boolean {
    return this.status === OrderItemStatus.READY;
  }

  isDelivered(): boolean {
    return this.status === OrderItemStatus.DELIVERED;
  }

  isFailed(): boolean {
    return this.status === OrderItemStatus.FAILED;
  }

  isCompleted(): boolean {
    return this.isDelivered() || this.isFailed();
  }

  getPreparationTime(): number | null {
    if (!this.preparedAt) return null;
    return Math.round((this.preparedAt.getTime() - this.createdAt.getTime()) / 1000);
  }

  // Serialization
  toPrimitives(): any {
    return {
      id: this.id.getValue(),
      orderId: this.orderId.getValue(),
      recipeId: this.recipeId,
      recipeName: this.recipeName,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      assignedAt: this.assignedAt?.toISOString(),
      preparedAt: this.preparedAt?.toISOString(),
      deliveredAt: this.deliveredAt?.toISOString(),
      failureReason: this.failureReason,
    };
  }

  static fromPrimitives(data: any): OrderItem {
    const item = new OrderItem(
      new OrderItemId(data.id),
      new OrderId(data.orderId),
      data.status as OrderItemStatus,
      new Date(data.createdAt)
    );

    if (data.recipeId) {
      (item as any).recipeId = data.recipeId;
      (item as any).recipeName = data.recipeName;
    }

    if (data.assignedAt) {
      (item as any).assignedAt = new Date(data.assignedAt);
    }

    if (data.preparedAt) {
      (item as any).preparedAt = new Date(data.preparedAt);
    }

    if (data.deliveredAt) {
      (item as any).deliveredAt = new Date(data.deliveredAt);
    }

    if (data.failureReason) {
      (item as any).failureReason = data.failureReason;
    }

    return item;
  }
}
