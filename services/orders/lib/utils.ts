/**
 * Utility functions for Orders Service
 */

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  INGREDIENTS_REQUESTED = 'INGREDIENTS_REQUESTED',
  WAITING_FOR_INGREDIENTS = 'WAITING_FOR_INGREDIENTS',
  COOKING = 'COOKING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Generate unique order ID with timestamp
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
}

/**
 * Calculate estimated preparation time based on quantity
 */
export function calculateEstimatedTime(quantity: number): number {
  const baseTime = 5; // 5 minutes base
  const perItemTime = 2; // 2 minutes per item
  return baseTime + (quantity * perItemTime);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Validate order quantity against limits
 */
export function validateQuantity(quantity: number): boolean {
  return quantity > 0 && quantity <= 100;
}

/**
 * Calculate order priority based on creation time
 */
export function calculatePriority(createdAt: Date): number {
  const now = Date.now();
  const orderTime = new Date(createdAt).getTime();
  const waitTime = now - orderTime;

  // Higher priority for older orders
  if (waitTime > 30 * 60 * 1000) return 3; // > 30 min
  if (waitTime > 15 * 60 * 1000) return 2; // > 15 min
  if (waitTime > 5 * 60 * 1000) return 1;  // > 5 min
  return 0;
}