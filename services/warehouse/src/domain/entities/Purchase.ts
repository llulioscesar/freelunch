/**
 * Entity: Purchase
 * Represents a purchase from the farmers market
 */
import { PurchaseId } from '../value-objects/PurchaseId';
import { IngredientName, ValidIngredient } from '../value-objects/IngredientName';
import { Quantity } from '../value-objects/Quantity';

export type PurchaseStatus = 'pending' | 'completed' | 'failed';

export class Purchase {
  private readonly id: PurchaseId;
  private readonly ingredientName: IngredientName;
  private readonly requestedQuantity: Quantity;
  private obtainedQuantity: Quantity;
  private status: PurchaseStatus;
  private readonly plateId: string | null;
  private readonly orderId: string | null;
  private errorMessage: string | null;
  private readonly createdAt: Date;
  private completedAt: Date | null;

  constructor(
    id: PurchaseId,
    ingredientName: IngredientName,
    requestedQuantity: Quantity,
    obtainedQuantity?: Quantity,
    status?: PurchaseStatus,
    plateId?: string | null,
    orderId?: string | null,
    errorMessage?: string | null,
    createdAt?: Date,
    completedAt?: Date | null
  ) {
    this.id = id;
    this.ingredientName = ingredientName;
    this.requestedQuantity = requestedQuantity;
    this.obtainedQuantity = obtainedQuantity || Quantity.zero();
    this.status = status || 'pending';
    this.plateId = plateId || null;
    this.orderId = orderId || null;
    this.errorMessage = errorMessage || null;
    this.createdAt = createdAt || new Date();
    this.completedAt = completedAt || null;
  }

  // Getters
  getId(): PurchaseId {
    return this.id;
  }

  getIngredientName(): IngredientName {
    return this.ingredientName;
  }

  getRequestedQuantity(): Quantity {
    return this.requestedQuantity;
  }

  getObtainedQuantity(): Quantity {
    return this.obtainedQuantity;
  }

  getStatus(): PurchaseStatus {
    return this.status;
  }

  getPlateId(): string | null {
    return this.plateId;
  }

  getOrderId(): string | null {
    return this.orderId;
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getCompletedAt(): Date | null {
    return this.completedAt;
  }

  // Business Methods
  markAsCompleted(obtainedQuantity: Quantity): void {
    this.obtainedQuantity = obtainedQuantity;
    this.status = 'completed';
    this.completedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.completedAt = new Date();
  }

  isSuccessful(): boolean {
    return this.status === 'completed' && this.obtainedQuantity.getValue() > 0;
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  // Serialization
  toPrimitives(): {
    id: string;
    ingredientName: ValidIngredient;
    requestedQuantity: number;
    obtainedQuantity: number;
    status: PurchaseStatus;
    plateId: string | null;
    orderId: string | null;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  } {
    return {
      id: this.id.getValue(),
      ingredientName: this.ingredientName.getValue(),
      requestedQuantity: this.requestedQuantity.getValue(),
      obtainedQuantity: this.obtainedQuantity.getValue(),
      status: this.status,
      plateId: this.plateId,
      orderId: this.orderId,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt.toISOString(),
      completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    };
  }

  static fromPrimitives(data: {
    id: string;
    ingredientName: string;
    requestedQuantity: number;
    obtainedQuantity: number;
    status: PurchaseStatus;
    plateId?: string | null;
    orderId?: string | null;
    errorMessage?: string | null;
    createdAt?: string;
    completedAt?: string | null;
  }): Purchase {
    return new Purchase(
      new PurchaseId(data.id),
      new IngredientName(data.ingredientName),
      new Quantity(data.requestedQuantity),
      new Quantity(data.obtainedQuantity),
      data.status,
      data.plateId,
      data.orderId,
      data.errorMessage,
      data.createdAt ? new Date(data.createdAt) : undefined,
      data.completedAt ? new Date(data.completedAt) : null
    );
  }

  // Factory method
  static create(
    ingredientName: string,
    requestedQuantity: number,
    plateId?: string,
    orderId?: string
  ): Purchase {
    return new Purchase(
      new PurchaseId(),
      new IngredientName(ingredientName),
      new Quantity(requestedQuantity),
      Quantity.zero(),
      'pending',
      plateId,
      orderId
    );
  }

  equals(other: Purchase): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `Purchase(${this.ingredientName.getValue()}: ${this.obtainedQuantity.getValue()}/${this.requestedQuantity.getValue()} - ${this.status})`;
  }
}
