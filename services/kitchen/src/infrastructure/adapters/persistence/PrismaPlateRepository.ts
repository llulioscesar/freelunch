/**
 * Adapter: Prisma Plate Repository
 * Kitchen Service
 *
 * Implements PlateRepository interface using Prisma ORM
 */
import { PrismaClient as BasePrismaClient } from '../../../generated/prisma/client/index.js';
import { Plate } from '../../../domain/entities/Plate';
import { PlateId } from '../../../domain/value-objects/PlateId';
import { PlateStatusEnum } from '../../../domain/value-objects/PlateStatus';
import { PlateRepository } from '../../../domain/repositories/PlateRepository';
import { logger } from '../../logging/Logger';
import { metricsService } from '../../metrics/MetricsService';

export class PrismaPlateRepository implements PlateRepository {
  constructor(private readonly prisma: BasePrismaClient) {}

  async save(plate: Plate): Promise<void> {
    const startTime = Date.now();
    const data = plate.toPrimitives();

    await this.prisma.plate.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        orderId: data.orderId,
        orderItemId: data.orderItemId,
        recipeId: data.recipeId,
        recipeName: data.recipeName,
        ingredients: data.ingredients,
        status: data.status,
        createdAt: new Date(data.createdAt),
        assignedAt: data.assignedAt ? new Date(data.assignedAt) : null,
        cookingAt: data.cookingAt ? new Date(data.cookingAt) : null,
        readyAt: data.readyAt ? new Date(data.readyAt) : null,
        failureReason: data.failureReason,
        retryCount: data.retryCount,
      },
      update: {
        recipeId: data.recipeId,
        recipeName: data.recipeName,
        ingredients: data.ingredients,
        status: data.status,
        assignedAt: data.assignedAt ? new Date(data.assignedAt) : null,
        cookingAt: data.cookingAt ? new Date(data.cookingAt) : null,
        readyAt: data.readyAt ? new Date(data.readyAt) : null,
        failureReason: data.failureReason,
        retryCount: data.retryCount,
      },
    });

    const duration = (Date.now() - startTime) / 1000;
    metricsService.recordDatabaseQuery('plate_save', duration);

    logger.logRepositoryOperation('save', 'Plate', data.id);
  }

  async findById(id: PlateId): Promise<Plate | null> {
    const startTime = Date.now();

    const record = await this.prisma.plate.findUnique({
      where: { id: id.getValue() },
    });

    const duration = (Date.now() - startTime) / 1000;
    metricsService.recordDatabaseQuery('plate_findById', duration);

    if (!record) {
      return null;
    }

    return Plate.fromPrimitives({
      id: record.id,
      orderId: record.orderId,
      orderItemId: record.orderItemId,
      recipeId: record.recipeId,
      recipeName: record.recipeName,
      ingredients: record.ingredients as Record<string, number> | null,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      assignedAt: record.assignedAt?.toISOString(),
      cookingAt: record.cookingAt?.toISOString(),
      readyAt: record.readyAt?.toISOString(),
      failureReason: record.failureReason,
      retryCount: record.retryCount,
    });
  }

  async findByOrderItemId(orderItemId: string): Promise<Plate | null> {
    const record = await this.prisma.plate.findUnique({
      where: { orderItemId },
    });

    if (!record) {
      return null;
    }

    return Plate.fromPrimitives({
      id: record.id,
      orderId: record.orderId,
      orderItemId: record.orderItemId,
      recipeId: record.recipeId,
      recipeName: record.recipeName,
      ingredients: record.ingredients as Record<string, number> | null,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      assignedAt: record.assignedAt?.toISOString(),
      cookingAt: record.cookingAt?.toISOString(),
      readyAt: record.readyAt?.toISOString(),
      failureReason: record.failureReason,
      retryCount: record.retryCount,
    });
  }

  async findByOrderId(orderId: string): Promise<Plate[]> {
    const records = await this.prisma.plate.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: any) =>
      Plate.fromPrimitives({
        id: record.id,
        orderId: record.orderId,
        orderItemId: record.orderItemId,
        recipeId: record.recipeId,
        recipeName: record.recipeName,
        ingredients: record.ingredients as Record<string, number> | null,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        assignedAt: record.assignedAt?.toISOString(),
        cookingAt: record.cookingAt?.toISOString(),
        readyAt: record.readyAt?.toISOString(),
        failureReason: record.failureReason,
        retryCount: record.retryCount,
      })
    );
  }

  async findByStatus(status: PlateStatusEnum): Promise<Plate[]> {
    const records = await this.prisma.plate.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: any) =>
      Plate.fromPrimitives({
        id: record.id,
        orderId: record.orderId,
        orderItemId: record.orderItemId,
        recipeId: record.recipeId,
        recipeName: record.recipeName,
        ingredients: record.ingredients as Record<string, number> | null,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        assignedAt: record.assignedAt?.toISOString(),
        cookingAt: record.cookingAt?.toISOString(),
        readyAt: record.readyAt?.toISOString(),
        failureReason: record.failureReason,
        retryCount: record.retryCount,
      })
    );
  }

  async findAll(): Promise<Plate[]> {
    const records = await this.prisma.plate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record: any) =>
      Plate.fromPrimitives({
        id: record.id,
        orderId: record.orderId,
        orderItemId: record.orderItemId,
        recipeId: record.recipeId,
        recipeName: record.recipeName,
        ingredients: record.ingredients as Record<string, number> | null,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        assignedAt: record.assignedAt?.toISOString(),
        cookingAt: record.cookingAt?.toISOString(),
        readyAt: record.readyAt?.toISOString(),
        failureReason: record.failureReason,
        retryCount: record.retryCount,
      })
    );
  }

  async findInProgress(): Promise<Plate[]> {
    const records = await this.prisma.plate.findMany({
      where: {
        status: {
          in: [
            PlateStatusEnum.ASSIGNED,
            PlateStatusEnum.REQUESTING_INGREDIENTS,
            PlateStatusEnum.COOKING,
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: any) =>
      Plate.fromPrimitives({
        id: record.id,
        orderId: record.orderId,
        orderItemId: record.orderItemId,
        recipeId: record.recipeId,
        recipeName: record.recipeName,
        ingredients: record.ingredients as Record<string, number> | null,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        assignedAt: record.assignedAt?.toISOString(),
        cookingAt: record.cookingAt?.toISOString(),
        readyAt: record.readyAt?.toISOString(),
        failureReason: record.failureReason,
        retryCount: record.retryCount,
      })
    );
  }

  async delete(id: PlateId): Promise<void> {
    await this.prisma.plate.delete({
      where: { id: id.getValue() },
    });

    logger.logRepositoryOperation('delete', 'Plate', id.getValue());
  }

  async countByStatus(status: PlateStatusEnum): Promise<number> {
    return await this.prisma.plate.count({
      where: { status },
    });
  }

  async count(): Promise<number> {
    return await this.prisma.plate.count();
  }

  async getCountsByStatus(): Promise<Record<string, number>> {
    const counts = await this.prisma.plate.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const result: Record<string, number> = {};
    counts.forEach((c: { status: string; _count: { status: number } }) => {
      result[c.status] = c._count.status;
    });

    return result;
  }

  async getRecipeStats(limit = 10): Promise<{
    recipeName: string;
    total: number;
    ready: number;
    failed: number;
  }[]> {
    // Get total counts per recipe
    const recipeCounts = await this.prisma.plate.groupBy({
      by: ['recipeName'],
      _count: { recipeName: true },
      where: {
        recipeName: { not: null },
      },
      orderBy: {
        _count: { recipeName: 'desc' },
      },
      take: limit,
    });

    // Get success/failure counts per recipe
    const recipeStatusCounts = await this.prisma.plate.groupBy({
      by: ['recipeName', 'status'],
      _count: { status: true },
      where: {
        recipeName: { not: null },
        status: { in: ['READY', 'FAILED'] },
      },
    });

    // Build result map
    const statsMap = new Map<string, { total: number; ready: number; failed: number }>();

    recipeCounts.forEach((r: { recipeName: string | null; _count: { recipeName: number } }) => {
      if (r.recipeName) {
        statsMap.set(r.recipeName, {
          total: r._count.recipeName,
          ready: 0,
          failed: 0,
        });
      }
    });

    recipeStatusCounts.forEach((r: { recipeName: string | null; status: string; _count: { status: number } }) => {
      if (r.recipeName && statsMap.has(r.recipeName)) {
        const stats = statsMap.get(r.recipeName)!;
        if (r.status === 'READY') {
          stats.ready = r._count.status;
        } else if (r.status === 'FAILED') {
          stats.failed = r._count.status;
        }
      }
    });

    return Array.from(statsMap.entries()).map(([recipeName, stats]) => ({
      recipeName,
      ...stats,
    }));
  }

  async getFailureReasons(limit = 10): Promise<{
    reason: string;
    count: number;
  }[]> {
    const reasons = await this.prisma.plate.groupBy({
      by: ['failureReason'],
      _count: { failureReason: true },
      where: {
        status: 'FAILED',
        failureReason: { not: null },
      },
      orderBy: {
        _count: { failureReason: 'desc' },
      },
      take: limit,
    });

    return reasons.map((r: { failureReason: string | null; _count: { failureReason: number } }) => ({
      reason: r.failureReason || 'Unknown',
      count: r._count.failureReason,
    }));
  }
}
