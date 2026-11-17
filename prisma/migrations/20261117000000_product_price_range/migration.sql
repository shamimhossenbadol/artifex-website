-- Price range (ADR-076): when maxPrice is set the product shows "regularPrice – maxPrice".

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `maxPrice` INTEGER NULL;
