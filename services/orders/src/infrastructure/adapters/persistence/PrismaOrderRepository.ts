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
        items: {
          create: data.items.map((item: any) => ({
            id: item.id,
            recipeId: item.recipeId,
            recipeName: item.recipeName,
            status: item.status,
            createdAt: new Date(item.createdAt),
            assignedAt: item.assignedAt ? new Date(item.assignedAt) : null,
            preparedAt: item.preparedAt ? new Date(item.preparedAt) : null,
            deliveredAt: item.deliveredAt ? new Date(item.deliveredAt) : null,
            failureReason: item.failureReason,
          })),
        },
      },
    });
  }

  async findById(id: OrderId): Promise<Order | null> {
    const orderData = await this.prisma.order.findUnique({
      where: { id: id.getValue() },
      include: {
        items: true,
      },
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
      items: orderData.items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        assignedAt: item.assignedAt?.toISOString(),
        preparedAt: item.preparedAt?.toISOString(),
        deliveredAt: item.deliveredAt?.toISOString(),
        failureReason: item.failureReason,
      })),
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
      include: {
        items: true,
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
      items: data.items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        assignedAt: item.assignedAt?.toISOString(),
        preparedAt: item.preparedAt?.toISOString(),
        deliveredAt: item.deliveredAt?.toISOString(),
        failureReason: item.failureReason,
      })),
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

    // Use transaction to update order and all items atomically
    await this.prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: data.id },
        data: {
          status: data.status,
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
          updatedAt: new Date(data.updatedAt),
        },
      });

      // Update each order item
      for (const item of data.items) {
        await tx.orderItem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            orderId: data.id,
            recipeId: item.recipeId,
            recipeName: item.recipeName,
            status: item.status,
            createdAt: new Date(item.createdAt),
            assignedAt: item.assignedAt ? new Date(item.assignedAt) : null,
            preparedAt: item.preparedAt ? new Date(item.preparedAt) : null,
            deliveredAt: item.deliveredAt ? new Date(item.deliveredAt) : null,
            failureReason: item.failureReason,
          },
          update: {
            recipeId: item.recipeId,
            recipeName: item.recipeName,
            status: item.status,
            assignedAt: item.assignedAt ? new Date(item.assignedAt) : null,
            preparedAt: item.preparedAt ? new Date(item.preparedAt) : null,
            deliveredAt: item.deliveredAt ? new Date(item.deliveredAt) : null,
            failureReason: item.failureReason,
          },
        });
      }
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