/**
 * Adapter: PrismaInventoryRepository
 * Implements InventoryRepository using Prisma
 */
import { PrismaClientSingleton } from './PrismaClient';
import { InventoryRepository } from '../../../domain/repositories/InventoryRepository';
import { InventoryItem } from '../../../domain/entities/InventoryItem';
import { IngredientName } from '../../../domain/value-objects/IngredientName';
import { InventoryItemId } from '../../../domain/value-objects/InventoryItemId';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { logger } from '../../logging/Logger';

export class PrismaInventoryRepository implements InventoryRepository {
  private get prisma() {
    return PrismaClientSingleton.getInstance();
  }

  async findById(id: InventoryItemId): Promise<InventoryItem | null> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { id: id.getValue() },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByIngredientName(name: IngredientName): Promise<InventoryItem | null> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { ingredientName: name.getValue() },
    });

    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<InventoryItem[]> {
    const records = await this.prisma.inventoryItem.findMany({
      orderBy: { ingredientName: 'asc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async save(item: InventoryItem): Promise<void> {
    const data = {
      ingredientName: item.getIngredientName().getValue(),
      quantity: item.getQuantity().getValue(),
      updatedAt: new Date(),
    };

    await this.prisma.inventoryItem.upsert({
      where: { id: item.getId().getValue() },
      create: {
        id: item.getId().getValue(),
        ...data,
      },
      update: data,
    });

    logger.debug('Inventory item saved', {
      id: item.getId().getValue(),
      ingredientName: item.getIngredientName().getValue(),
      quantity: item.getQuantity().getValue(),
    });
  }

  async initializeDefaultStock(): Promise<void> {
    const allIngredients = IngredientName.getAllValidIngredients();
    const INITIAL_STOCK = 5;

    for (const ingredientName of allIngredients) {
      const existing = await this.prisma.inventoryItem.findUnique({
        where: { ingredientName },
      });

      if (!existing) {
        await this.prisma.inventoryItem.create({
          data: {
            ingredientName,
            quantity: INITIAL_STOCK,
          },
        });

        logger.info('Initialized inventory item', {
          ingredientName,
          quantity: INITIAL_STOCK,
        });
      }
    }
  }

  async findByIngredientNames(names: IngredientName[]): Promise<InventoryItem[]> {
    const ingredientNames = names.map((n) => n.getValue());

    const records = await this.prisma.inventoryItem.findMany({
      where: {
        ingredientName: { in: ingredientNames },
      },
    });

    return records.map((r) => this.toDomain(r));
  }

  async checkAvailability(
    requirements: Map<string, number>
  ): Promise<{ available: boolean; missing: Map<string, number> }> {
    const missing = new Map<string, number>();

    for (const [ingredientName, required] of requirements) {
      const item = await this.prisma.inventoryItem.findUnique({
        where: { ingredientName },
      });

      const available = item?.quantity ?? 0;
      if (available < required) {
        missing.set(ingredientName, required - available);
      }
    }

    return {
      available: missing.size === 0,
      missing,
    };
  }

  private toDomain(record: {
    id: string;
    ingredientName: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
  }): InventoryItem {
    return new InventoryItem(
      new InventoryItemId(record.id),
      new IngredientName(record.ingredientName),
      new Quantity(record.quantity),
      record.createdAt,
      record.updatedAt
    );
  }
}
