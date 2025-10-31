-- CreateTable
CREATE TABLE "ExternalHire" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "amountVnd" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalHire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalHire_projectId_startDate_idx" ON "ExternalHire"("projectId", "startDate");

-- CreateIndex
CREATE INDEX "ExternalHire_projectId_endDate_idx" ON "ExternalHire"("projectId", "endDate");

-- AddForeignKey
ALTER TABLE "ExternalHire" ADD CONSTRAINT "ExternalHire_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
