-- CreateTable
CREATE TABLE "OrderItemStatusHistory" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" TEXT,
    "recipeName" TEXT,
    "reason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "OrderItemStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItemStatusHistory_orderItemId_idx" ON "OrderItemStatusHistory"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemStatusHistory_changedAt_idx" ON "OrderItemStatusHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "OrderItemStatusHistory" ADD CONSTRAINT "OrderItemStatusHistory_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
