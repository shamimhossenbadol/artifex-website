-- ADR-059: SKU, material and dimensions are now ordinary specification rows. Existing values are
-- copied into ProductSpec first (skipped when the product already has a row with that label),
-- then the columns are dropped. Dropping a column also drops the indexes on it (Product_sku_key),
-- so no index or constraint is named here (production names can differ, see ADR-054).

-- Data: keep existing values as specification rows, after the current ones.
INSERT INTO `ProductSpec` (`productId`, `label`, `value`, `sortOrder`)
SELECT p.`id`, 'Material', TRIM(p.`material`), 1000
FROM `Product` p
WHERE p.`material` IS NOT NULL AND TRIM(p.`material`) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM `ProductSpec` s WHERE s.`productId` = p.`id` AND LOWER(TRIM(s.`label`)) = 'material'
  );

INSERT INTO `ProductSpec` (`productId`, `label`, `value`, `sortOrder`)
SELECT p.`id`, 'Dimensions', TRIM(p.`dimensions`), 1001
FROM `Product` p
WHERE p.`dimensions` IS NOT NULL AND TRIM(p.`dimensions`) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM `ProductSpec` s WHERE s.`productId` = p.`id` AND LOWER(TRIM(s.`label`)) = 'dimensions'
  );

INSERT INTO `ProductSpec` (`productId`, `label`, `value`, `sortOrder`)
SELECT p.`id`, 'SKU', TRIM(p.`sku`), 1002
FROM `Product` p
WHERE p.`sku` IS NOT NULL AND TRIM(p.`sku`) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM `ProductSpec` s WHERE s.`productId` = p.`id` AND LOWER(TRIM(s.`label`)) = 'sku'
  );

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `sku`,
    DROP COLUMN `material`,
    DROP COLUMN `dimensions`;
