/**
 * Entity: Plate
 * Represents a dish being prepared in the kitchen
 */
import { PlateId } from '../value-objects/PlateId';
import { PlateStatus, PlateStatusEnum } from '../value-objects/PlateStatus';
import { OrderReference } from '../value-objects/OrderReference';
import { RecipeId } from '../value-objects/RecipeId';
import { Ingredients } from '../value-objects/Ingredients';
import { PlateAssignedEvent } from '../events/PlateAssignedEvent';
import { IngredientsRequestedEvent } from '../events/IngredientsRequestedEvent';
import { PlateCookingStartedEvent } from '../events/PlateCookingStartedEvent';
import { PlateReadyEvent } from '../events/PlateReadyEvent';
import { PlateFailedEvent } from '../events/PlateFailedEvent';
import { logger } from '../../infrastructure/logging/Logger';

export class Plate {
  private readonly id: PlateId;
  private readonly orderReference: OrderReference;
  private recipeId?: RecipeId;
  private recipeName?: string;
  private ingredients?: Ingredients;
  private status: PlateStatus;
  private readonly createdAt: Date;
  private assignedAt?: Date;
  private cookingAt?: Date;
  private readyAt?: Date;
  private failureReason?: string;
  private retryCount: number = 0;
  private domainEvents: any[] = [];

  constructor(
    id: PlateId,
    orderReference: OrderReference,
    status?: PlateStatus,
    createdAt?: Date
  ) {
    this.id = id;
    this.orderReference = orderReference;
    this.status = status || new PlateStatus(PlateStatusEnum.PENDING);
    this.createdAt = createdAt || new Date();
  }

  // Getters
  getId(): PlateId {
    return this.id;
  }

  getOrderReference(): OrderReference {
    return this.orderReference;
  }

  getRecipeId(): RecipeId | undefined {
    return this.recipeId;
  }

  getRecipeName(): string | undefined {
    return this.recipeName;
  }

  getIngredients(): Ingredients | undefined {
    return this.ingredients;
  }

  getStatus(): PlateStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getAssignedAt(): Date | undefined {
    return this.assignedAt;
  }

  getCookingAt(): Date | undefined {
    return this.cookingAt;
  }

  getReadyAt(): Date | undefined {
    return this.readyAt;
  }

  getFailureReason(): string | undefined {
    return this.failureReason;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  // Business Methods
  assignRecipe(recipeId: RecipeId, recipeName: string, ingredients: Ingredients): void {
    if (!this.status.isPending()) {
      throw new Error('Can only assign recipe to pending plates');
    }

    this.recipeId = recipeId;
    this.recipeName = recipeName;
    this.ingredients = ingredients;
    this.status = new PlateStatus(PlateStatusEnum.ASSIGNED);
    this.assignedAt = new Date();

    // Emit domain event
    const event = new PlateAssignedEvent(
      this.id.getValue(),
      this.orderReference.getOrderId(),
      this.orderReference.getOrderItemId(),
      recipeId.getValue(),
      recipeName,
      ingredients.toPrimitives()
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('plate.assigned', this.id.getValue(), {
      recipeId: recipeId.getValue(),
      recipeName,
      orderId: this.orderReference.getOrderId(),
    });
  }

  requestIngredients(): void {
    if (!this.status.isAssigned()) {
      throw new Error('Plate must be assigned before requesting ingredients');
    }

    if (!this.ingredients) {
      throw new Error('Ingredients must be set before requesting');
    }

    this.status = new PlateStatus(PlateStatusEnum.REQUESTING_INGREDIENTS);

    // Emit domain event
    const event = new IngredientsRequestedEvent(
      this.id.getValue(),
      this.orderReference.getOrderId(),
      this.orderReference.getOrderItemId(),
      this.recipeId!.getValue(),
      this.recipeName!,
      this.ingredients.toPrimitives()
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('ingredients.requested', this.id.getValue(), {
      recipeId: this.recipeId!.getValue(),
      ingredients: this.ingredients.toPrimitives(),
    });
  }

  startCooking(): void {
    if (!this.status.isRequestingIngredients()) {
      throw new Error('Plate must be requesting ingredients before cooking');
    }

    this.status = new PlateStatus(PlateStatusEnum.COOKING);
    this.cookingAt = new Date();

    // Emit domain event
    const event = new PlateCookingStartedEvent(
      this.id.getValue(),
      this.orderReference.getOrderId(),
      this.orderReference.getOrderItemId(),
      this.recipeId!.getValue(),
      this.recipeName || '',
      this.cookingAt
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('plate.cooking', this.id.getValue(), {
      recipeName: this.recipeName,
    });
  }

  markAsReady(): void {
    if (!this.status.isCooking()) {
      throw new Error('Plate must be cooking to mark as ready');
    }

    this.status = new PlateStatus(PlateStatusEnum.READY);
    this.readyAt = new Date();

    // Calculate preparation time
    const preparationTimeSeconds = Math.round(
      (this.readyAt.getTime() - this.createdAt.getTime()) / 1000
    );

    // Emit domain event
    const event = new PlateReadyEvent(
      this.id.getValue(),
      this.orderReference.getOrderId(),
      this.orderReference.getOrderItemId(),
      this.recipeId!.getValue(),
      this.recipeName!,
      this.readyAt,
      preparationTimeSeconds
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('plate.ready', this.id.getValue(), {
      recipeName: this.recipeName,
      preparationTimeSeconds,
    });
  }

  markAsFailed(reason: string): void {
    const previousStatus = this.status.getValue();
    this.status = new PlateStatus(PlateStatusEnum.FAILED);
    this.failureReason = reason;
    this.retryCount += 1;

    // Emit domain event
    const event = new PlateFailedEvent(
      this.id.getValue(),
      this.orderReference.getOrderId(),
      this.orderReference.getOrderItemId(),
      this.recipeId?.getValue(),
      this.recipeName,
      reason,
      new Date(),
      this.retryCount
    );
    this.addDomainEvent(event);

    logger.logDomainEvent('plate.failed', this.id.getValue(), {
      reason,
      previousStatus,
      retryCount: this.retryCount,
    });
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

  isAssigned(): boolean {
    return this.status.isAssigned();
  }

  isRequestingIngredients(): boolean {
    return this.status.isRequestingIngredients();
  }

  isCooking(): boolean {
    return this.status.isCooking();
  }

  isReady(): boolean {
    return this.status.isReady();
  }

  isFailed(): boolean {
    return this.status.isFailed();
  }

  isCompleted(): boolean {
    return this.status.isFinal();
  }

  canRequestIngredients(): boolean {
    return this.status.isAssigned() && this.ingredients !== undefined;
  }

  requiresUrgentAttention(): boolean {
    const minutesSinceCreation =
      (Date.now() - this.createdAt.getTime()) / (1000 * 60);
    return minutesSinceCreation > 15 && !this.isCompleted();
  }

  getPreparationTime(): number | null {
    if (!this.readyAt) return null;
    return Math.round((this.readyAt.getTime() - this.createdAt.getTime()) / 1000);
  }

  canRetry(): boolean {
    return this.isFailed() && this.retryCount < 3;
  }

  // Serialization
  toPrimitives(): any {
    return {
      id: this.id.getValue(),
      orderReference: this.orderReference.toPrimitives(),
      orderId: this.orderReference.getOrderId(),
      orderItemId: this.orderReference.getOrderItemId(),
      recipeId: this.recipeId?.getValue(),
      recipeName: this.recipeName,
      ingredients: this.ingredients?.toPrimitives(),
      status: this.status.getValue(),
      createdAt: this.createdAt.toISOString(),
      assignedAt: this.assignedAt?.toISOString(),
      cookingAt: this.cookingAt?.toISOString(),
      readyAt: this.readyAt?.toISOString(),
      failureReason: this.failureReason,
      retryCount: this.retryCount,
    };
  }

  static fromPrimitives(data: any): Plate {
    const plate = new Plate(
      new PlateId(data.id),
      OrderReference.fromPrimitives({
        orderId: data.orderId,
        orderItemId: data.orderItemId,
      }),
      new PlateStatus(data.status as PlateStatusEnum),
      new Date(data.createdAt)
    );

    if (data.recipeId) {
      (plate as any).recipeId = new RecipeId(data.recipeId);
      (plate as any).recipeName = data.recipeName;
    }

    if (data.ingredients) {
      (plate as any).ingredients = Ingredients.fromJSON(data.ingredients);
    }

    if (data.assignedAt) {
      (plate as any).assignedAt = new Date(data.assignedAt);
    }

    if (data.cookingAt) {
      (plate as any).cookingAt = new Date(data.cookingAt);
    }

    if (data.readyAt) {
      (plate as any).readyAt = new Date(data.readyAt);
    }

    if (data.failureReason) {
      (plate as any).failureReason = data.failureReason;
      (plate as any).retryCount = data.retryCount || 0;
    }

    return plate;
  }
}
