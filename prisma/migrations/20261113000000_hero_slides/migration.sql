-- Hero slider (ADR-039): the hero's single photo becomes a list of slides.

-- CreateTable
CREATE TABLE `HomeHeroSlide` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imagePath` VARCHAR(255) NOT NULL,
    `imageAlt` VARCHAR(160) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HomeHeroSlide_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Keep the photo the owner already uploaded as the first slide (not the seed placeholder).
INSERT INTO `HomeHeroSlide` (`imagePath`, `imageAlt`, `sortOrder`)
SELECT `imagePath`, `imageAlt`, 10 FROM `HomeHero`
WHERE `id` = 1 AND `imagePath` <> '' AND `imagePath` <> 'home/placeholder-hero';

-- AlterTable
ALTER TABLE `HomeHero` DROP COLUMN `imagePath`,
    DROP COLUMN `imageAlt`;
