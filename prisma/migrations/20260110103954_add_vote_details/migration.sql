-- AlterTable
ALTER TABLE `Vote` ADD COLUMN `content` TEXT NOT NULL DEFAULT '',
    ADD COLUMN `description` TEXT NOT NULL DEFAULT '';
