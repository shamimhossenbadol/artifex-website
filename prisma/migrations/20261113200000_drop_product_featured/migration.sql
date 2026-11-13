-- Cleanup (ADR-042): the Featured / Most loved homepage rails were removed (ADR-035), so the
-- Featured flag and the rail ordering have no effect anywhere. Popular stays: it ranks search
-- results and related products.

-- DropIndex
DROP INDEX `Product_status_isFeatured_homeSortOrder_idx` ON `Product`;

-- DropIndex
DROP INDEX `Product_status_isPopular_homeSortOrder_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `homeSortOrder`,
    DROP COLUMN `isFeatured`;

-- CreateIndex
CREATE INDEX `Product_status_isPopular_publishedAt_idx` ON `Product`(`status`, `isPopular`, `publishedAt`);
