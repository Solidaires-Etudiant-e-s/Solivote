-- AlterTable
ALTER TABLE `Vote` ADD COLUMN `texteId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Texte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(191) NOT NULL,
    `rencontreId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


INSERT INTO `Texte` (`titre`, `rencontreId`)
SELECT
    CONCAT('Pas de texte (vieux) ', `id`) AS titre,
    `id`
FROM `Rencontre`;


UPDATE `Vote` v
JOIN `Texte` t
  ON v.`rencontreId` = t.`rencontreId`
SET v.`texteId` = t.`id`;


ALTER TABLE `Vote` DROP FOREIGN KEY `Vote_rencontreId_fkey`;
DROP INDEX `Vote_rencontreId_fkey` ON `Vote`;

ALTER TABLE `Vote`
    DROP COLUMN `rencontreId`,
    MODIFY COLUMN `texteId` INTEGER NOT NULL;   -- keep NOT NULL after data is set


-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_texteId_fkey` FOREIGN KEY (`texteId`) REFERENCES `Texte`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Texte` ADD CONSTRAINT `Texte_rencontreId_fkey` FOREIGN KEY (`rencontreId`) REFERENCES `Rencontre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
