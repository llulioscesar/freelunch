/**
 * Value Object: PlateStatus
 * Represents the status of a plate with business rules
 */

export enum PlateStatusEnum {
  PENDING = 'PENDING',              // Created, waiting for recipe assignment
  ASSIGNED = 'ASSIGNED',            // Recipe assigned
  REQUESTING_INGREDIENTS = 'REQUESTING_INGREDIENTS', // Requesting ingredients from Warehouse
  COOKING = 'COOKING',              // Ingredients received, cooking in progress
  READY = 'READY',                  // Plate prepared and ready for delivery
  FAILED = 'FAILED',                // Preparation failed
}

export class PlateStatus {
  private readonly value: PlateStatusEnum;

  constructor(value: PlateStatusEnum) {
    this.validateStatus(value);
    this.value = value;
  }

  private validateStatus(value: PlateStatusEnum): void {
    const validStatuses = Object.values(PlateStatusEnum);
    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid plate status: ${value}`);
    }
  }

  getValue(): PlateStatusEnum {
    return this.value;
  }

  // Business Rules: Status Transitions
  canTransitionTo(newStatus: PlateStatusEnum): boolean {
    const transitions: Record<PlateStatusEnum, PlateStatusEnum[]> = {
      [PlateStatusEnum.PENDING]: [PlateStatusEnum.ASSIGNED, PlateStatusEnum.FAILED],
      [PlateStatusEnum.ASSIGNED]: [
        PlateStatusEnum.REQUESTING_INGREDIENTS,
        PlateStatusEnum.FAILED,
      ],
      [PlateStatusEnum.REQUESTING_INGREDIENTS]: [
        PlateStatusEnum.COOKING,
        PlateStatusEnum.FAILED,
      ],
      [PlateStatusEnum.COOKING]: [PlateStatusEnum.READY, PlateStatusEnum.FAILED],
      [PlateStatusEnum.READY]: [], // Final state
      [PlateStatusEnum.FAILED]: [], // Final state
    };

    return transitions[this.value].includes(newStatus);
  }

  // Status Checks
  isPending(): boolean {
    return this.value === PlateStatusEnum.PENDING;
  }

  isAssigned(): boolean {
    return this.value === PlateStatusEnum.ASSIGNED;
  }

  isRequestingIngredients(): boolean {
    return this.value === PlateStatusEnum.REQUESTING_INGREDIENTS;
  }

  isCooking(): boolean {
    return this.value === PlateStatusEnum.COOKING;
  }

  isReady(): boolean {
    return this.value === PlateStatusEnum.READY;
  }

  isFailed(): boolean {
    return this.value === PlateStatusEnum.FAILED;
  }

  isFinal(): boolean {
    return this.isReady() || this.isFailed();
  }

  isInProgress(): boolean {
    return (
      this.isAssigned() ||
      this.isRequestingIngredients() ||
      this.isCooking()
    );
  }

  equals(other: PlateStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
