/**
 * Adapter: Cached Order Repository (Decorator Pattern)
 *
 * Wraps PrismaOrderRepository with Redis caching layer:
 *
 * READ Strategy: Cache-Aside Pattern
 * 1. Try cache first
 * 2. On miss, fetch from DB
 * 3. Store in cache for next time
 *
 * WRITE Strategy: Write-Through Pattern
 * 1. Write to database (source of truth)
 * 2. Update cache immediately
 * 3. Invalidate related caches
 *
 * Cache Keys:
 * - order:{orderId}           → Single order (TTL: 5 min)
 * - orders:list:{hash}        → List queries (TTL: 1 min)
 * - orders:count:{hash}       → Count queries (TTL: 1 min)
 */
import { OrderRepository, OrderFilters } from '../../../domain/repositories/OrderRepository';
import { Order } from '../../../domain/entities/Order';
import { OrderId } from '../../../domain/value-objects/OrderId';
import { PrismaOrderRepository } from './PrismaOrderRepository';
import { RedisClient } from '../cache/RedisClient';
import { Redis } from '@upstash/redis';
import { logger } from '../../logging/Logger';

export class CachedOrderRepository implements OrderRepository {
  private redis: Redis;
  private baseRepository: PrismaOrderRepository;

  // Cache TTLs in seconds
  private readonly CACHE_TTL_ORDER = 300; // 5 minutes
  private readonly CACHE_TTL_LIST = 60; // 1 minute
  private readonly CACHE_TTL_IMMUTABLE = 3600; // 1 hour for completed orders

  // Key for tracking list/count cache keys (for invalidation)
  private readonly LIST_KEYS_SET = 'orders:list-keys';

  constructor(baseRepository: PrismaOrderRepository) {
    this.baseRepository = baseRepository;
    this.redis = RedisClient.getInstance();
  }

  /**
   * WRITE-THROUGH: Save to DB then update cache
   */
  async save(order: Order): Promise<void> {
    // 1. Save to database (source of truth)
    await this.baseRepository.save(order);

    // 2. Update cache immediately (write-through)
    const cacheKey = this.getOrderCacheKey(order.getId());
    const data = order.toPrimitives();
    await this.redis.set(cacheKey, JSON.stringify(data), {
      ex: this.CACHE_TTL_ORDER,
    });

    // 3. Invalidate list caches (they're now stale)
    await this.invalidateListCaches();

    logger.logCacheOperation('set', cacheKey, {
      entityId: order.getId().getValue(),
      ttl: this.CACHE_TTL_ORDER,
    });
  }

  /**
   * CACHE-ASIDE: Try cache first, fallback to DB
   */
  async findById(id: OrderId): Promise<Order | null> {
    const cacheKey = this.getOrderCacheKey(id);

    try {
      // 1. Try to get from cache
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        logger.logCacheOperation('hit', cacheKey, { entityId: id.getValue() });
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return Order.fromPrimitives(data);
      }

      logger.logCacheOperation('miss', cacheKey, { entityId: id.getValue() });
    } catch (error) {
      console.error('Cache read error:', error);
      // Continue to DB on cache error
    }

    // 2. Fetch from database
    const order = await this.baseRepository.findById(id);

    // 3. Store in cache for next time
    if (order) {
      const data = order.toPrimitives();
      const ttl = this.shouldCacheImmutably(order)
        ? this.CACHE_TTL_IMMUTABLE
        : this.CACHE_TTL_ORDER;

      await this.redis.set(cacheKey, JSON.stringify(data), { ex: ttl });
      console.log(`💾 Cached order: ${id.getValue()} (TTL: ${ttl}s)`);
    }

    return order;
  }

  /**
   * CACHE-ASIDE for lists (with query hash for cache key)
   */
  async findAll(filters?: OrderFilters): Promise<Order[]> {
    const cacheKey = this.getListCacheKey(filters);

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        console.log(`✅ Cache HIT (list): ${cacheKey}`);
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return data.map((item: any) => Order.fromPrimitives(item));
      }

      console.log(`❌ Cache MISS (list): ${cacheKey}`);
    } catch (error) {
      console.error('Cache read error:', error);
    }

    // Fetch from database
    const orders = await this.baseRepository.findAll(filters);

    // Cache the result and track the key for invalidation
    const data = orders.map((order) => order.toPrimitives());
    await this.redis.set(cacheKey, JSON.stringify(data), {
      ex: this.CACHE_TTL_LIST,
    });
    await this.redis.sadd(this.LIST_KEYS_SET, cacheKey);

    return orders;
  }

  /**
   * Count with caching
   */
  async count(filters?: OrderFilters): Promise<number> {
    const cacheKey = this.getCountCacheKey(filters);

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) {
        console.log(`✅ Cache HIT (count): ${cacheKey}`);
        return Number(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    const count = await this.baseRepository.count(filters);

    // Cache and track the key for invalidation
    await this.redis.set(cacheKey, count, { ex: this.CACHE_TTL_LIST });
    await this.redis.sadd(this.LIST_KEYS_SET, cacheKey);

    return count;
  }

  /**
   * WRITE-THROUGH: Update DB then invalidate cache
   */
  async update(order: Order): Promise<void> {
    // 1. Update database
    await this.baseRepository.update(order);

    // 2. Invalidate specific order cache (will be re-cached on next read)
    const cacheKey = this.getOrderCacheKey(order.getId());
    await this.redis.del(cacheKey);

    // 3. Invalidate list caches
    await this.invalidateListCaches();

    console.log(`🗑️ Order updated and cache invalidated: ${order.getId().getValue()}`);
  }

  /**
   * Delete from DB and cache
   */
  async delete(id: OrderId): Promise<void> {
    await this.baseRepository.delete(id);

    const cacheKey = this.getOrderCacheKey(id);
    await this.redis.del(cacheKey);

    await this.invalidateListCaches();

    console.log(`🗑️ Order deleted from DB and cache: ${id.getValue()}`);
  }

  /**
   * Check existence (use cache)
   */
  async exists(id: OrderId): Promise<boolean> {
    // Try cache first
    const cacheKey = this.getOrderCacheKey(id);
    const cached = await this.redis.exists(cacheKey);

    if (cached) {
      return true;
    }

    // Fallback to database
    return this.baseRepository.exists(id);
  }

  // ==================== Cache Key Generators ====================

  private getOrderCacheKey(id: OrderId): string {
    return `order:${id.getValue()}`;
  }

  private getListCacheKey(filters?: OrderFilters): string {
    // Create a deterministic hash from filters
    const hash = this.hashFilters(filters);
    return `orders:list:${hash}`;
  }

  private getCountCacheKey(filters?: OrderFilters): string {
    const hash = this.hashFilters(filters);
    return `orders:count:${hash}`;
  }

  /**
   * Create a simple hash from filters for cache key
   */
  private hashFilters(filters?: OrderFilters): string {
    if (!filters) return 'all';

    const parts = [
      filters.status || 'any',
      filters.customerName || 'any',
      filters.fromDate?.toISOString() || 'any',
      filters.toDate?.toISOString() || 'any',
      filters.sortBy || 'createdAt',
      filters.sortOrder || 'desc',
      filters.offset?.toString() || '0',
      filters.limit?.toString() || '10',
    ];

    return parts.join(':');
  }

  /**
   * Invalidate all list and count caches
   * Gets all tracked keys from the Set and deletes them
   */
  private async invalidateListCaches(): Promise<void> {
    try {
      // Get all tracked list/count cache keys
      const keys = await this.redis.smembers(this.LIST_KEYS_SET);

      if (keys.length === 0) {
        return;
      }

      // Delete all cached lists/counts
      await this.redis.del(...keys);

      // Clear the tracking set
      await this.redis.del(this.LIST_KEYS_SET);

      console.log(`🗑️ Invalidated ${keys.length} list/count caches`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Determine if order should be cached immutably (longer TTL)
   * Completed/Failed/Cancelled orders don't change
   */
  private shouldCacheImmutably(order: Order): boolean {
    return order.isCompleted();
  }
}
