/**
 * Adapter: Prisma Plate Repository
 * Kitchen Service
 *
 * Implements PlateRepository interface using Prisma ORM
 */
import { PrismaClient as BasePrismaClient } from '../../../generated/prisma/client/client';
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

    return records.map((record) =>
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

    return records.map((record) =>
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

    return records.map((record) =>
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

    return records.map((record) =>
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
}
