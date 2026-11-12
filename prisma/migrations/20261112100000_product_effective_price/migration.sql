-- DropIndex
DROP INDEX `Product_status_regularPrice_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `effectivePrice` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Product_status_effectivePrice_idx` ON `Product`(`status`, `effectivePrice`);


-- Backfill existing rows
UPDATE `Product` SET `effectivePrice` = COALESCE(`discountPrice`, `regularPrice`);
