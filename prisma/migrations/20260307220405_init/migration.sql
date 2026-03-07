-- DropForeignKey
ALTER TABLE `Choix` DROP FOREIGN KEY `Choix_voteId_fkey`;

-- DropIndex
DROP INDEX `Choix_voteId_fkey` ON `Choix`;

-- AddForeignKey
ALTER TABLE `Choix` ADD CONSTRAINT `Choix_voteId_fkey` FOREIGN KEY (`voteId`) REFERENCES `Vote`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
