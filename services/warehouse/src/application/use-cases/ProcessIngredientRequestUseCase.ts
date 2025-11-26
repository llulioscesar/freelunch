/**
 * Use Case: ProcessIngredientRequestUseCase
 * Processes ingredient requests from kitchen service
 *
 * Flow:
 * 1. Receive request from kitchen with ingredients needed
 * 2. Check inventory for each ingredient
 * 3. If not enough, purchase from market
 * 4. Reserve ingredients (subtract from inventory)
 * 5. Send response back to kitchen
 */
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { PurchaseRepository } from '../../domain/repositories/PurchaseRepository';
import { MarketClient } from '../ports/out/MarketClient';
import { KitchenClient } from '../ports/out/KitchenClient';
import { IngredientName } from '../../domain/value-objects/IngredientName';
import { Quantity } from '../../domain/value-objects/Quantity';
import { Purchase } from '../../domain/entities/Purchase';
import { InventoryItem } from '../../domain/entities/InventoryItem';
import { IngredientsResponseDTO } from '../dto/IngredientsRequestDTO';
import { logger } from '../../infrastructure/logging/Logger';

export interface ProcessIngredientRequestInput {
  plateId: string;
  orderItemId: string;
  recipeId: string;
  recipeName: string;
  ingredients: Record<string, number>;
  requestedAt: string;
}

export interface ProcessIngredientRequestOutput {
  success: boolean;
  plateId: string;
  orderItemId: string;
  processedIngredients: Record<string, number>;
  unavailableIngredients: string[];
  message: string;
}

const MAX_PURCHASE_ATTEMPTS = 10;

export class ProcessIngredientRequestUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly purchaseRepository: PurchaseRepository,
    private readonly marketClient: MarketClient,
    private readonly kitchenClient: KitchenClient
  ) {}

  async execute(
    input: ProcessIngredientRequestInput
  ): Promise<ProcessIngredientRequestOutput> {
    const startTime = Date.now();
    const unavailableIngredients: string[] = [];
    const processedIngredients: Record<string, number> = {};

    logger.info('Processing ingredient request', {
      plateId: input.plateId,
      recipeId: input.recipeId,
      recipeName: input.recipeName,
      ingredients: input.ingredients,
    });

    try {
      // Process each ingredient
      for (const [ingredientName, requiredQuantity] of Object.entries(
        input.ingredients
      )) {
        const success = await this.processIngredient(
          ingredientName,
          requiredQuantity,
          input.plateId,
          input.orderItemId
        );

        if (success) {
          processedIngredients[ingredientName] = requiredQuantity;
        } else {
          unavailableIngredients.push(ingredientName);
        }
      }

      const allSuccess = unavailableIngredients.length === 0;

      // Build response
      const response: IngredientsResponseDTO = {
        plateId: input.plateId,
        orderItemId: input.orderItemId,
        success: allSuccess,
        ingredients: input.ingredients,
        availableIngredients: allSuccess ? processedIngredients : undefined,
        unavailableIngredients: allSuccess ? undefined : unavailableIngredients,
        message: allSuccess
          ? 'All ingredients reserved successfully'
          : `Failed to obtain ingredients: ${unavailableIngredients.join(', ')}`,
        processedAt: new Date().toISOString(),
      };

      // Send response back to kitchen
      await this.kitchenClient.sendIngredientsResponse(response);

      const duration = Date.now() - startTime;
      logger.info('Ingredient request processed', {
        plateId: input.plateId,
        success: allSuccess,
        duration,
        processedIngredients,
        unavailableIngredients,
      });

      return {
        success: allSuccess,
        plateId: input.plateId,
        orderItemId: input.orderItemId,
        processedIngredients,
        unavailableIngredients,
        message: response.message!,
      };
    } catch (error) {
      logger.error('Failed to process ingredient request', error as Error, {
        plateId: input.plateId,
      });

      // Send failure response
      const response: IngredientsResponseDTO = {
        plateId: input.plateId,
        orderItemId: input.orderItemId,
        success: false,
        ingredients: input.ingredients,
        unavailableIngredients: Object.keys(input.ingredients),
        message: `Error processing request: ${(error as Error).message}`,
        processedAt: new Date().toISOString(),
      };

      await this.kitchenClient.sendIngredientsResponse(response);

      throw error;
    }
  }

  private async processIngredient(
    ingredientName: string,
    requiredQuantity: number,
    plateId: string,
    orderItemId: string
  ): Promise<boolean> {
    try {
      const ingredient = new IngredientName(ingredientName);
      const required = new Quantity(requiredQuantity);

      // Get or create inventory item
      let inventoryItem = await this.inventoryRepository.findByIngredientName(
        ingredient
      );

      if (!inventoryItem) {
        // Create with initial stock of 5
        inventoryItem = InventoryItem.createWithInitialStock(ingredientName, 5);
        await this.inventoryRepository.save(inventoryItem);
        logger.info('Created inventory item with initial stock', {
          ingredientName,
          initialStock: 5,
        });
      }

      // Check if we have enough
      let attempts = 0;
      while (
        !inventoryItem.hasEnoughStock(required) &&
        attempts < MAX_PURCHASE_ATTEMPTS
      ) {
        attempts++;
        const missing = inventoryItem.getMissingQuantity(required);

        logger.info('Insufficient stock, purchasing from market', {
          ingredientName,
          currentStock: inventoryItem.getQuantity().getValue(),
          required: required.getValue(),
          missing: missing.getValue(),
          attempt: attempts,
        });

        // Purchase from market
        const purchased = await this.purchaseFromMarket(
          ingredientName,
          missing.getValue(),
          plateId,
          orderItemId
        );

        if (purchased > 0) {
          // Add to inventory
          inventoryItem.addStock(new Quantity(purchased));
          await this.inventoryRepository.save(inventoryItem);

          logger.info('Added purchased stock to inventory', {
            ingredientName,
            purchased,
            newStock: inventoryItem.getQuantity().getValue(),
          });
        } else {
          logger.warn('Market returned 0 quantity', {
            ingredientName,
            attempt: attempts,
          });
        }

        // Re-fetch to get latest state
        inventoryItem = await this.inventoryRepository.findByIngredientName(
          ingredient
        );
        if (!inventoryItem) {
          throw new Error(`Inventory item disappeared: ${ingredientName}`);
        }
      }

      // Final check
      if (!inventoryItem.hasEnoughStock(required)) {
        logger.warn('Could not obtain enough stock after max attempts', {
          ingredientName,
          required: required.getValue(),
          available: inventoryItem.getQuantity().getValue(),
          attempts,
        });
        return false;
      }

      // Reserve (subtract from inventory)
      inventoryItem.removeStock(required);
      await this.inventoryRepository.save(inventoryItem);

      logger.info('Ingredient reserved', {
        ingredientName,
        reserved: required.getValue(),
        remainingStock: inventoryItem.getQuantity().getValue(),
      });

      return true;
    } catch (error) {
      logger.error('Failed to process ingredient', error as Error, {
        ingredientName,
        requiredQuantity,
      });
      return false;
    }
  }

  private async purchaseFromMarket(
    ingredientName: string,
    requestedQuantity: number,
    plateId: string,
    orderItemId: string
  ): Promise<number> {
    // Create purchase record
    const purchase = Purchase.create(
      ingredientName,
      requestedQuantity,
      plateId,
      orderItemId
    );

    try {
      // Call market API
      const result = await this.marketClient.buyIngredient(ingredientName);

      if (result.success && result.quantitySold > 0) {
        purchase.markAsCompleted(new Quantity(result.quantitySold));
      } else {
        purchase.markAsCompleted(Quantity.zero());
      }

      // Save purchase record
      await this.purchaseRepository.save(purchase);

      logger.info('Market purchase completed', {
        purchaseId: purchase.getId().getValue(),
        ingredientName,
        requested: requestedQuantity,
        obtained: result.quantitySold,
      });

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
