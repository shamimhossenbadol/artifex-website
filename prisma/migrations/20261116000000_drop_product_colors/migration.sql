-- Products have no colour variations (ADR-054): drop the ProductColor table and the {color}
-- placeholder from the saved WhatsApp product message.

-- DropForeignKey
ALTER TABLE `ProductColor` DROP FOREIGN KEY `ProductColor_productId_fkey`;

-- DropTable
DROP TABLE `ProductColor`;

-- Data: the template no longer supports {color}.
UPDATE `SiteSetting` SET `whatsappProductTemplate` = REPLACE(`whatsappProductTemplate`, '{color}', '');
