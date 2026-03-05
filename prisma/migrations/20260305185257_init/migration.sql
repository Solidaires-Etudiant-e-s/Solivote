-- CreateTable
CREATE TABLE `Vote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nom` VARCHAR(191) NOT NULL,
    `type` ENUM('STANDARD', 'EN_CONTRE', 'CONDORCET') NOT NULL,
    `description` TEXT NULL,
    `rencontreId` INTEGER NOT NULL,
    `status` ENUM('INITIAL', 'EN_VOTE', 'CLOTURE') NOT NULL DEFAULT 'INITIAL',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Possibilite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `voteId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Choix` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `syndicatId` INTEGER NOT NULL,
    `voteId` INTEGER NOT NULL,
    `choix` JSON NOT NULL,

    UNIQUE INDEX `Choix_syndicatId_voteId_key`(`syndicatId`, `voteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Syndicat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Syndicat_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mandat` (
    `syndicatId` INTEGER NOT NULL,
    `rencontreId` INTEGER NOT NULL,
    `mandat` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`syndicatId`, `rencontreId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rencontre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL DEFAULT '',
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `type` ENUM('CONGRES', 'CF', 'BF', 'PU') NOT NULL,
    `status` ENUM('INITIAL', 'DEMARE', 'CLOTURE') NOT NULL DEFAULT 'INITIAL',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_rencontreId_fkey` FOREIGN KEY (`rencontreId`) REFERENCES `Rencontre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Possibilite` ADD CONSTRAINT `Possibilite_voteId_fkey` FOREIGN KEY (`voteId`) REFERENCES `Vote`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Choix` ADD CONSTRAINT `Choix_syndicatId_fkey` FOREIGN KEY (`syndicatId`) REFERENCES `Syndicat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Choix` ADD CONSTRAINT `Choix_voteId_fkey` FOREIGN KEY (`voteId`) REFERENCES `Vote`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mandat` ADD CONSTRAINT `Mandat_syndicatId_fkey` FOREIGN KEY (`syndicatId`) REFERENCES `Syndicat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mandat` ADD CONSTRAINT `Mandat_rencontreId_fkey` FOREIGN KEY (`rencontreId`) REFERENCES `Rencontre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
