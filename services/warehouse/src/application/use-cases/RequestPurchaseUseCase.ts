/**
 * Use Case: RequestPurchaseUseCase
 * Allows requesting a direct purchase of an ingredient from the market
 * Used by AI assistant to resolve low stock/out of stock alerts
 */
import { InventoryRepository } from '../../domain/repositories/InventoryRepository.js';
import { PurchaseRepository } from '../../domain/repositories/PurchaseRepository.js';
import { MarketClient } from '../ports/out/MarketClient.js';
import { IngredientName } from '../../domain/value-objects/IngredientName.js';
import { Quantity } from '../../domain/value-objects/Quantity.js';
import { Purchase } from '../../domain/entities/Purchase.js';
import { InventoryItem } from '../../domain/entities/InventoryItem.js';
import { logger } from '../../infrastructure/logging/Logger.js';

export interface RequestPurchaseInput {
  ingredientName: string;
  quantity: number;
}

export interface RequestPurchaseOutput {
  success: boolean;
  ingredientName: string;
  requestedQuantity: number;
  obtainedQuantity: number;
  newStockLevel: number;
  message: string;
}

const MAX_PURCHASE_ATTEMPTS = 3;

export class RequestPurchaseUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly purchaseRepository: PurchaseRepository,
    private readonly marketClient: MarketClient
  ) {}

  async execute(input: RequestPurchaseInput): Promise<RequestPurchaseOutput> {
    const { ingredientName, quantity } = input;

    logger.info('Processing purchase request from AI', {
      ingredientName,
      requestedQuantity: quantity,
    });

    try {
      const ingredient = new IngredientName(ingredientName);
      let totalObtained = 0;
      let attempts = 0;

      // Get or create inventory item
      let inventoryItem = await this.inventoryRepository.findByIngredientName(ingredient);

      if (!inventoryItem) {
        inventoryItem = InventoryItem.createWithInitialStock(ingredientName, 0);
        await this.inventoryRepository.save(inventoryItem);
        logger.info('Created inventory item', { ingredientName });
      }

      // Try to purchase the requested quantity
      while (totalObtained < quantity && attempts < MAX_PURCHASE_ATTEMPTS) {
        attempts++;
        const remaining = quantity - totalObtained;

        const purchased = await this.purchaseFromMarket(
          ingredientName,
          remaining
        );

        if (purchased > 0) {
          totalObtained += purchased;
          inventoryItem.addStock(new Quantity(purchased));
          await this.inventoryRepository.save(inventoryItem);

          logger.info('Added purchased stock to inventory', {
            ingredientName,
            purchased,
            totalObtained,
            attempt: attempts,
          });
        } else {
          logger.warn('Market returned 0 quantity', {
            ingredientName,
            attempt: attempts,
          });
          // If market returns 0, don't keep trying
          break;
        }
      }

      // Fetch final state
      inventoryItem = await this.inventoryRepository.findByIngredientName(ingredient);
      const newStockLevel = inventoryItem?.getQuantity().getValue() ?? 0;

      const success = totalObtained > 0;
      const message = success
        ? `Compra exitosa: ${totalObtained} unidades de ${ingredientName}. Stock actual: ${newStockLevel}`
        : `No se pudo obtener ${ingredientName} del mercado`;

      logger.info('Purchase request completed', {
        ingredientName,
        success,
        requestedQuantity: quantity,
        obtainedQuantity: totalObtained,
        newStockLevel,
      });

      return {
        success,
        ingredientName,
        requestedQuantity: quantity,
        obtainedQuantity: totalObtained,
        newStockLevel,
        message,
      };
    } catch (error) {
      logger.error('Failed to process purchase request', error as Error, {
        ingredientName,
        quantity,
      });

      return {
        success: false,
        ingredientName,
        requestedQuantity: quantity,
        obtainedQuantity: 0,
        newStockLevel: 0,
        message: `Error al procesar la compra: ${(error as Error).message}`,
      };
    }
  }

  private async purchaseFromMarket(
    ingredientName: string,
    requestedQuantity: number
  ): Promise<number> {
    // Create purchase record (no plate/orderItem since this is a direct request)
    const purchase = Purchase.create(
      ingredientName,
      requestedQuantity,
      'ai-request',
      'ai-request'
    );

    try {
      const result = await this.marketClient.buyIngredient(ingredientName);

      if (result.success && result.quantitySold > 0) {
        purchase.markAsCompleted(new Quantity(result.quantitySold));
      } else {
        purchase.markAsCompleted(Quantity.zero());
      }

      await this.purchaseRepository.save(purchase);

      return result.quantitySold;
    } catch (error) {
      purchase.markAsFailed((error as Error).message);
      await this.purchaseRepository.save(purchase);

      logger.error('Market purchase failed', error as Error, {
        purchaseId: purchase.getId().getValue(),
        ingredientName,
      });

      return 0;
    }
  }
}
