/*
  Warnings:

  - You are about to drop the column `type` on the `Choix` table. All the data in the column will be lost.
  - Added the required column `choix` to the `Choix` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Choix` DROP COLUMN `type`,
    ADD COLUMN `choix` JSON NOT NULL;

-- AlterTable
ALTER TABLE `Vote` ADD COLUMN `type` ENUM('STANDARD', 'EN_CONTRE', 'CONDORCET') NOT NULL,
    MODIFY `description` TEXT NULL;

-- CreateTable
CREATE TABLE `Possibilite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `voteId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Possibilite` ADD CONSTRAINT `Possibilite_voteId_fkey` FOREIGN KEY (`voteId`) REFERENCES `Vote`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
