-- ADR-060: a product has one description for search engines. Product.shortDescription is it (it
-- isn't shown on the product page any more); a separately typed SEO description wins, then the
-- duplicate column is dropped. Categories and posts keep their own seoDescription.

-- Data
UPDATE `Product`
SET `shortDescription` = TRIM(`seoDescription`)
WHERE `seoDescription` IS NOT NULL AND TRIM(`seoDescription`) <> '';

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `seoDescription`;
