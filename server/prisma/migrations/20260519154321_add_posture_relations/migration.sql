/*
  Warnings:

  - Added the required column `userId` to the `PostureCorrectionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `postureassessment` ADD COLUMN `imageUrl` VARCHAR(500) NULL,
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `posturecorrectionplan` ADD COLUMN `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `PostureAssessment` ADD CONSTRAINT `PostureAssessment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostureCorrectionPlan` ADD CONSTRAINT `PostureCorrectionPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostureCorrectionPlan` ADD CONSTRAINT `PostureCorrectionPlan_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `PostureAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
