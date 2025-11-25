/**
 * Use Case: GetInventoryUseCase
 * Retrieves current inventory status
 */
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { InventoryDTO, InventoryItemDTO } from '../dto/InventoryDTO';
import { logger } from '../../infrastructure/logging/Logger';

export class GetInventoryUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(): Promise<InventoryDTO> {
    logger.debug('Getting inventory');

    const items = await this.inventoryRepository.findAll();

    const itemDTOs: InventoryItemDTO[] = items.map((item) => ({
      id: item.getId().getValue(),
      ingredientName: item.getIngredientName().getValue(),
      quantity: item.getQuantity().getValue(),
      createdAt: item.getCreatedAt().toISOString(),
      updatedAt: item.getUpdatedAt().toISOString(),
    }));

    // Sort by ingredient name
    itemDTOs.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

    const lastUpdated =
      items.length > 0
        ? new Date(
            Math.max(...items.map((i) => i.getUpdatedAt().getTime()))
          ).toISOString()
        : new Date().toISOString();

    logger.debug('Inventory retrieved', {
      totalItems: items.length,
    });

    return {
      items: itemDTOs,
      totalItems: items.length,
      lastUpdated,
    };
  }
}
