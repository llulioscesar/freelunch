-- CreateTable
CREATE TABLE "PlateStatusHistory" (
    "id" TEXT NOT NULL,
    "plateId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" TEXT,
    "recipeName" TEXT,
    "reason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "PlateStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlateStatusHistory_plateId_idx" ON "PlateStatusHistory"("plateId");

-- CreateIndex
CREATE INDEX "PlateStatusHistory_changedAt_idx" ON "PlateStatusHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "PlateStatusHistory" ADD CONSTRAINT "PlateStatusHistory_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
