-- AlterTable
ALTER TABLE "MaterialPurchase" ADD COLUMN     "quantityText" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "quantity" DROP NOT NULL;
