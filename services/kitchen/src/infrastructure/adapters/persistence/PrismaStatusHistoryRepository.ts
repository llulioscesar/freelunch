/**
 * Adapter: Prisma Status History Repository
 * Implements the StatusHistoryRepository interface using Prisma ORM
 */
import { PrismaClient } from '../../../generated/prisma/client/index.js';
import { prismaClient } from './PrismaClient.js';
import {
  StatusHistoryRepository,
  PlateStatusHistoryEntry,
} from '../../../domain/repositories/StatusHistoryRepository.js';

export class PrismaStatusHistoryRepository implements StatusHistoryRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || prismaClient;
  }

  async record(
    entry: Omit<PlateStatusHistoryEntry, 'id' | 'changedAt'>
  ): Promise<PlateStatusHistoryEntry> {
    const created = await this.prisma.plateStatusHistory.create({
      data: {
        plateId: entry.plateId,
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
      plateId: created.plateId,
      fromStatus: created.fromStatus,
      toStatus: created.toStatus,
      changedAt: created.changedAt,
      recipeId: created.recipeId || undefined,
      recipeName: created.recipeName || undefined,
      reason: created.reason || undefined,
      metadata: created.metadata as Record<string, any> | undefined,
    };
  }

  async findByPlateId(plateId: string): Promise<PlateStatusHistoryEntry[]> {
    const entries = await this.prisma.plateStatusHistory.findMany({
      where: { plateId },
      orderBy: { changedAt: 'asc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      plateId: entry.plateId,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      changedAt: entry.changedAt,
      recipeId: entry.recipeId || undefined,
      recipeName: entry.recipeName || undefined,
      reason: entry.reason || undefined,
      metadata: entry.metadata as Record<string, any> | undefined,
    }));
  }

  async findByOrderId(orderId: string): Promise<PlateStatusHistoryEntry[]> {
    const entries = await this.prisma.plateStatusHistory.findMany({
      where: {
        plate: {
          orderId,
        },
      },
      orderBy: { changedAt: 'asc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      plateId: entry.plateId,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      changedAt: entry.changedAt,
      recipeId: entry.recipeId || undefined,
      recipeName: entry.recipeName || undefined,
      reason: entry.reason || undefined,
      metadata: entry.metadata as Record<string, any> | undefined,
    }));
  }

  async findRecent(limit: number = 50): Promise<PlateStatusHistoryEntry[]> {
    const entries = await this.prisma.plateStatusHistory.findMany({
      orderBy: { changedAt: 'desc' },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      plateId: entry.plateId,
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
