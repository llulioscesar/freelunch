/**
 * Use Case: GetPurchaseHistoryUseCase
 * Retrieves purchase history from the farmers market
 */
import { PurchaseRepository } from '../../domain/repositories/PurchaseRepository';
import { Purchase } from '../../domain/entities/Purchase';
import { PurchaseDTO, PurchaseHistoryDTO } from '../dto/PurchaseDTO';
import { logger } from '../../infrastructure/logging/Logger';

export interface GetPurchaseHistoryInput {
  page?: number;
  limit?: number;
}

export class GetPurchaseHistoryUseCase {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async execute(input?: GetPurchaseHistoryInput): Promise<PurchaseHistoryDTO> {
    const page = input?.page || 1;
    const limit = input?.limit || 10;

    logger.debug('Getting purchase history', { page, limit });

    // Get paginated purchases and global stats in parallel
    const [{ purchases, total }, stats] = await Promise.all([
      this.purchaseRepository.findPaginated(page, limit),
      this.purchaseRepository.getStats(),
    ]);

    const purchaseDTOs: PurchaseDTO[] = purchases.map((purchase) => this.toDTO(purchase));

    const totalPages = Math.ceil(total / limit);

    logger.debug('Purchase history retrieved', {
      page,
      limit,
      total,
      totalPages,
      successful: stats.successful,
      failed: stats.failed,
    });

    return {
      purchases: purchaseDTOs,
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      pagination: {
        page,
        limit,
        totalPages,
      },
    };
  }

  private toDTO(purchase: Purchase): PurchaseDTO {
    return {
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
    };
  }
}
