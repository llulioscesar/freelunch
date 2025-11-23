/**
 * TypeScript definitions for custom Jest matchers
 */
declare namespace jest {
  interface Matchers<R> {
    toBeValidOrderId(): R;
    toBeValidOrderItemId(): R;
  }
}

export {};
