/**
 * Global type declarations for external libraries
 */

declare module '@upstash/redis' {
  export class Redis {
    constructor(config: any);
    xadd(...args: any[]): Promise<string>;
    xreadgroup(...args: any[]): Promise<any>;
    xgroup(...args: any[]): Promise<any>;
    xack(...args: any[]): Promise<number>;
    xpending(...args: any[]): Promise<any>;
    xclaim(...args: any[]): Promise<any>;
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, options?: any): Promise<any>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    ping(): Promise<string>;
    [key: string]: any; // Allow any method calls
  }
}

// Extend global types for middleware compatibility
declare global {
  type VercelHandler = any;
}
