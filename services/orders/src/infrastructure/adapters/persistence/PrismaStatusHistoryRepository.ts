/**
 * Adapter: Prisma Status History Repository
 * Implements the StatusHistoryRepository interface using Prisma ORM
 */
import { PrismaClient } from '@prisma/client';
import {
  StatusHistoryRepository,
  StatusHistoryEntry,
} from '../../../domain/repositories/StatusHistoryRepository';

export class PrismaStatusHistoryRepository implements StatusHistoryRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  async record(
    entry: Omit<StatusHistoryEntry, 'id' | 'changedAt'>
  ): Promise<StatusHistoryEntry> {
    const created = await this.prisma.orderItemStatusHistory.create({
      data: {
        orderItemId: entry.orderItemId,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        recipeId: entry.recipeId,
        recipeName: entry.recipeName,
        reason: entry.reason,
        metadata: entry.metadata || undefined,
      },
    });

    return {
      id: created.id,
      orderItemId: created.orderItemId,
      fromStatus: created.fromStatus,
      toStatus: created.toStatus,
      changedAt: created.changedAt,
      recipeId: created.recipeId || undefined,
      recipeName: created.recipeName || undefined,
      reason: created.reason || undefined,
      metadata: created.metadata as Record<string, any> | undefined,
    };
  }

  async findByOrderItemId(orderItemId: string): Promise<StatusHistoryEntry[]> {
    const entries = await this.prisma.orderItemStatusHistory.findMany({
      where: { orderItemId },
      orderBy: { changedAt: 'asc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      orderItemId: entry.orderItemId,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      changedAt: entry.changedAt,
      recipeId: entry.recipeId || undefined,
      recipeName: entry.recipeName || undefined,
      reason: entry.reason || undefined,
      metadata: entry.metadata as Record<string, any> | undefined,
    }));
  }

  async findByOrderId(orderId: string): Promise<StatusHistoryEntry[]> {
    const entries = await this.prisma.orderItemStatusHistory.findMany({
      where: {
        orderItem: {
          orderId,
        },
      },
      orderBy: { changedAt: 'asc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      orderItemId: entry.orderItemId,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      changedAt: entry.changedAt,
      recipeId: entry.recipeId || undefined,
      recipeName: entry.recipeName || undefined,
      reason: entry.reason || undefined,
      metadata: entry.metadata as Record<string, any> | undefined,
    }));
  }

  async findRecent(limit: number = 50): Promise<StatusHistoryEntry[]> {
    const entries = await this.prisma.orderItemStatusHistory.findMany({
      orderBy: { changedAt: 'desc' },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      orderItemId: entry.orderItemId,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      changedAt: entry.changedAt,
      recipeId: entry.recipeId || undefined,
      recipeName: entry.recipeName || undefined,
      reason: entry.reason || undefined,
      metadata: entry.metadata as Record<string, any> | undefined,
    }));
  }
}
