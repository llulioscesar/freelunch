/**
 * Adapter: PrismaPurchaseRepository
 * Implements PurchaseRepository using Prisma
 */
import { PrismaClientSingleton } from './PrismaClient';
import { PurchaseRepository } from '../../../domain/repositories/PurchaseRepository';
import { Purchase, PurchaseStatus } from '../../../domain/entities/Purchase';
import { PurchaseId } from '../../../domain/value-objects/PurchaseId';
import { IngredientName } from '../../../domain/value-objects/IngredientName';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { logger } from '../../logging/Logger';

export class PrismaPurchaseRepository implements PurchaseRepository {
  private get prisma() {
    return PrismaClientSingleton.getInstance();
  }

  async findById(id: PurchaseId): Promise<Purchase | null> {
    const record = await this.prisma.purchase.findUnique({
      where: { id: id.getValue() },
    });

    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findByStatus(status: PurchaseStatus): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findByIngredientName(name: IngredientName): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      where: { ingredientName: name.getValue() },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findByPlateId(plateId: string): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      where: { plateId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findRecent(limit: number): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findPaginated(page: number, limit: number): Promise<{ purchases: Purchase[]; total: number }> {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.purchase.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchase.count(),
    ]);

    return {
      purchases: records.map((r) => this.toDomain(r)),
      total,
    };
  }

  async save(purchase: Purchase): Promise<void> {
    const data = {
      ingredientName: purchase.getIngredientName().getValue(),
      requestedQuantity: purchase.getRequestedQuantity().getValue(),
      obtainedQuantity: purchase.getObtainedQuantity().getValue(),
      status: purchase.getStatus(),
      plateId: purchase.getPlateId(),
      orderId: purchase.getOrderId(),
      errorMessage: purchase.getErrorMessage(),
      completedAt: purchase.getCompletedAt(),
    };

    await this.prisma.purchase.upsert({
      where: { id: purchase.getId().getValue() },
      create: {
        id: purchase.getId().getValue(),
        ...data,
      },
      update: data,
    });

    logger.debug('Purchase saved', {
      id: purchase.getId().getValue(),
      ingredientName: purchase.getIngredientName().getValue(),
      status: purchase.getStatus(),
    });
  }

  async countByStatus(status: PurchaseStatus): Promise<number> {
    return await this.prisma.purchase.count({
      where: { status },
    });
  }

  async getStats(): Promise<{ total: number; successful: number; failed: number }> {
    const [total, failed] = await Promise.all([
      this.prisma.purchase.count(),
      this.prisma.purchase.count({
        where: { obtainedQuantity: 0 },
      }),
    ]);

    return {
      total,
      successful: total - failed,
      failed,
    };
  }

  async getTotalPurchasedByIngredient(name: IngredientName): Promise<number> {
    const result = await this.prisma.purchase.aggregate({
      where: {
        ingredientName: name.getValue(),
        status: 'completed',
      },
      _sum: {
        obtainedQuantity: true,
      },
    });

    return result._sum.obtainedQuantity ?? 0;
  }

  private toDomain(record: {
    id: string;
    ingredientName: string;
    requestedQuantity: number;
    obtainedQuantity: number;
    status: string;
    plateId: string | null;
    orderId: string | null;
    errorMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }): Purchase {
    return new Purchase(
      new PurchaseId(record.id),
      new IngredientName(record.ingredientName),
      new Quantity(record.requestedQuantity),
      new Quantity(record.obtainedQuantity),
      record.status as PurchaseStatus,
      record.plateId,
      record.orderId,
      record.errorMessage,
      record.createdAt,
      record.completedAt
    );
  }
}
