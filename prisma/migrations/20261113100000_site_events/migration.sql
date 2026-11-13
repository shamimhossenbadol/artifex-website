-- First-party analytics and the Meta Pixel setting (ADR-040).

-- AlterTable
ALTER TABLE `SiteSetting` ADD COLUMN `facebookPixelId` VARCHAR(20) NULL;

-- CreateTable
CREATE TABLE `SiteEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(20) NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `visitorHash` CHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SiteEvent_createdAt_idx`(`createdAt`),
    INDEX `SiteEvent_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
