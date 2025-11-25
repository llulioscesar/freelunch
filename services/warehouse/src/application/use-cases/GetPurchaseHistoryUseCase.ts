/**
 * Use Case: GetPurchaseHistoryUseCase
 * Retrieves purchase history from the farmers market
 */
import { PurchaseRepository } from '../../domain/repositories/PurchaseRepository';
import { PurchaseDTO, PurchaseHistoryDTO } from '../dto/PurchaseDTO';
import { logger } from '../../infrastructure/logging/Logger';

export interface GetPurchaseHistoryInput {
  limit?: number;
}

export class GetPurchaseHistoryUseCase {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async execute(input?: GetPurchaseHistoryInput): Promise<PurchaseHistoryDTO> {
    const limit = input?.limit || 100;

    logger.debug('Getting purchase history', { limit });

    const purchases = await this.purchaseRepository.findRecent(limit);

    const purchaseDTOs: PurchaseDTO[] = purchases.map((purchase) => ({
      id: purchase.getId().getValue(),
      ingredientName: purchase.getIngredientName().getValue(),
      requestedQuantity: purchase.getRequestedQuantity().getValue(),
      obtainedQuantity: purchase.getObtainedQuantity().getValue(),
      status: purchase.getStatus(),
      plateId: purchase.getPlateId(),
      orderId: purchase.getOrderId(),
      errorMessage: purchase.getErrorMessage(),
      createdAt: purchase.getCreatedAt().toISOString(),
      completedAt: purchase.getCompletedAt()?.toISOString() || null,
    }));

    const successful = purchases.filter((p) => p.isSuccessful()).length;
    const failed = purchases.filter((p) => p.isFailed()).length;

    logger.debug('Purchase history retrieved', {
      total: purchases.length,
      successful,
      failed,
    });

    return {
      purchases: purchaseDTOs,
      total: purchases.length,
      successful,
      failed,
    };
  }
}
