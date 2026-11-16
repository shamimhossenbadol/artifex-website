-- Products have no colour variations (ADR-054): drop the ProductColor table and the {color}
-- placeholder from the saved WhatsApp product message.
-- The foreign key lives on ProductColor itself, so dropping the table removes it too (the
-- production database names it differently, so it isn't dropped by name).

-- DropTable
DROP TABLE IF EXISTS `ProductColor`;

-- Data: the template no longer supports {color}.
UPDATE `SiteSetting` SET `whatsappProductTemplate` = REPLACE(`whatsappProductTemplate`, '{color}', '');
