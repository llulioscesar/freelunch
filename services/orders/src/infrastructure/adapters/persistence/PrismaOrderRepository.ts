/**
 * Adapter: Prisma Order Repository
 * Implements the OrderRepository interface using Prisma ORM
 */
import { PrismaClient } from '@prisma/client';
import { OrderRepository, OrderFilters } from '../../../domain/repositories/OrderRepository';
import { Order } from '../../../domain/entities/Order';
import { OrderId } from '../../../domain/value-objects/OrderId';

export class PrismaOrderRepository implements OrderRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }

  async save(order: Order): Promise<void> {
    const data = order.toPrimitives();

    await this.prisma.order.create({
      data: {
        id: data.id,
        quantity: data.quantity,
        customerName: data.customerName,
        notes: data.notes,
        status: data.status,
        createdAt: new Date(data.createdAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        updatedAt: new Date(data.updatedAt),
      },
    });
  }

  async findById(id: OrderId): Promise<Order | null> {
    const orderData = await this.prisma.order.findUnique({
      where: { id: id.getValue() },
    });

    if (!orderData) {
      return null;
    }

    return Order.fromPrimitives({
      id: orderData.id,
      quantity: orderData.quantity,
      customerName: orderData.customerName,
      notes: orderData.notes,
      status: orderData.status,
      createdAt: orderData.createdAt.toISOString(),
      completedAt: orderData.completedAt?.toISOString(),
      updatedAt: orderData.updatedAt.toISOString(),
    });
  }

  async findAll(filters?: OrderFilters): Promise<Order[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status.getValue();
    }

    if (filters?.customerName) {
      where.customerName = {
        contains: filters.customerName,
        mode: 'insensitive',
      };
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    const orderData = await this.prisma.order.findMany({
      where,
      skip: filters?.offset,
      take: filters?.limit,
      orderBy: {
        [filters?.sortBy || 'createdAt']: filters?.sortOrder || 'desc',
      },
    });

    return orderData.map(data => Order.fromPrimitives({
      id: data.id,
      quantity: data.quantity,
      customerName: data.customerName,
      notes: data.notes,
      status: data.status,
      createdAt: data.createdAt.toISOString(),
      completedAt: data.completedAt?.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    }));
  }

  async count(filters?: OrderFilters): Promise<number> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status.getValue();
    }

    if (filters?.customerName) {
      where.customerName = {
        contains: filters.customerName,
        mode: 'insensitive',
      };
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    return await this.prisma.order.count({ where });
  }

  async update(order: Order): Promise<void> {
    const data = order.toPrimitives();

    await this.prisma.order.update({
      where: { id: data.id },
      data: {
        status: data.status,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        updatedAt: new Date(data.updatedAt),
      },
    });
  }

  async delete(id: OrderId): Promise<void> {
    await this.prisma.order.delete({
      where: { id: id.getValue() },
    });
  }

  async exists(id: OrderId): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}