/**
 * Adapter: Prisma Recipe Repository
 * Kitchen Service
 *
 * Implements RecipeRepository interface using Prisma ORM
 */
import { PrismaClient as BasePrismaClient } from '../../../generated/prisma/client';
import { Recipe } from '../../../domain/entities/Recipe';
import { RecipeId } from '../../../domain/value-objects/RecipeId';
import { RecipeRepository } from '../../../domain/repositories/RecipeRepository';
import { logger } from '../../logging/Logger';

export class PrismaRecipeRepository implements RecipeRepository {
  constructor(private readonly prisma: BasePrismaClient) {}

  async save(recipe: Recipe): Promise<void> {
    const data = recipe.toPrimitives();

    await this.prisma.recipe.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        ingredients: data.ingredients,
      },
      update: {
        name: data.name,
        description: data.description,
        ingredients: data.ingredients,
      },
    });

    logger.logRepositoryOperation('save', 'Recipe', data.id);
  }

  async findById(id: RecipeId): Promise<Recipe | null> {
    const record = await this.prisma.recipe.findUnique({
      where: { id: id.getValue() },
    });

    if (!record) {
      return null;
    }

    return Recipe.fromPrimitives({
      id: record.id,
      name: record.name,
      description: record.description || '',
      ingredients: record.ingredients as Record<string, number>,
      createdAt: record.createdAt.toISOString(),
    });
  }

  async findByName(name: string): Promise<Recipe | null> {
    const record = await this.prisma.recipe.findUnique({
      where: { name },
    });

    if (!record) {
      return null;
    }

    return Recipe.fromPrimitives({
      id: record.id,
      name: record.name,
      description: record.description || '',
      ingredients: record.ingredients as Record<string, number>,
      createdAt: record.createdAt.toISOString(),
    });
  }

  async findAll(): Promise<Recipe[]> {
    const records = await this.prisma.recipe.findMany({
      orderBy: { name: 'asc' },
    });

    return records.map((record) =>
      Recipe.fromPrimitives({
        id: record.id,
        name: record.name,
        description: record.description || '',
        ingredients: record.ingredients as Record<string, number>,
        createdAt: record.createdAt.toISOString(),
      })
    );
  }

  async getRandomRecipe(): Promise<Recipe> {
    // Get total count
    const count = await this.prisma.recipe.count();

    if (count === 0) {
      throw new Error('No recipes available in database');
    }

    // Get random index
    const randomIndex = Math.floor(Math.random() * count);

    // Fetch random recipe
    const record = await this.prisma.recipe.findMany({
      skip: randomIndex,
      take: 1,
    });

    if (!record || record.length === 0) {
      throw new Error('Failed to fetch random recipe');
    }

    return Recipe.fromPrimitives({
      id: record[0].id,
      name: record[0].name,
      description: record[0].description || '',
      ingredients: record[0].ingredients as Record<string, number>,
      createdAt: record[0].createdAt.toISOString(),
    });
  }

  async delete(id: RecipeId): Promise<void> {
    await this.prisma.recipe.delete({
      where: { id: id.getValue() },
    });

    logger.logRepositoryOperation('delete', 'Recipe', id.getValue());
  }

  async count(): Promise<number> {
    return await this.prisma.recipe.count();
  }
}
