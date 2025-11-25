/**
 * Use Case: InitializeInventoryUseCase
 * Initializes inventory with default stock (5 units per ingredient)
 */
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { InventoryItem } from '../../domain/entities/InventoryItem';
import { IngredientName } from '../../domain/value-objects/IngredientName';
import { logger } from '../../infrastructure/logging/Logger';

const INITIAL_STOCK = 5;

export class InitializeInventoryUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(): Promise<void> {
    logger.info('Initializing inventory with default stock');

    const allIngredients = IngredientName.getAllValidIngredients();

    for (const ingredientName of allIngredients) {
      const ingredient = new IngredientName(ingredientName);
      const existing = await this.inventoryRepository.findByIngredientName(
        ingredient
      );

      if (!existing) {
        const item = InventoryItem.createWithInitialStock(
          ingredientName,
          INITIAL_STOCK
        );
        await this.inventoryRepository.save(item);

        logger.info('Created inventory item', {
          ingredientName,
          initialStock: INITIAL_STOCK,
        });
      } else {
        logger.debug('Inventory item already exists', {
          ingredientName,
          currentStock: existing.getQuantity().getValue(),
        });
      }
    }

    logger.info('Inventory initialization complete', {
      ingredients: allIngredients.length,
      initialStock: INITIAL_STOCK,
    });
  }
}
