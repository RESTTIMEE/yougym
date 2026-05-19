-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `openid` VARCHAR(64) NOT NULL,
    `unionid` VARCHAR(64) NULL,
    `nickname` VARCHAR(64) NOT NULL DEFAULT '用户',
    `avatarUrl` TEXT NULL,
    `phone` VARCHAR(20) NULL,
    `gender` INTEGER NOT NULL DEFAULT 0,
    `birthday` DATE NULL,
    `height` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `fitnessGoal` VARCHAR(32) NOT NULL DEFAULT 'muscle_gain',
    `restSeconds` INTEGER NOT NULL DEFAULT 60,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_openid_key`(`openid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BodyRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL,
    `bodyFatPct` DOUBLE NULL,
    `muscleMassKg` DOUBLE NULL,
    `flexibilityScore` DOUBLE NULL,
    `chest` DOUBLE NULL,
    `waist` DOUBLE NULL,
    `hip` DOUBLE NULL,
    `bmi` DOUBLE NULL,
    `recordDate` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BodyRecord_userId_recordDate_idx`(`userId`, `recordDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `creator` VARCHAR(64) NOT NULL DEFAULT '系统',
    `durationWeeks` INTEGER NOT NULL DEFAULT 4,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `description` TEXT NULL,
    `coverImage` VARCHAR(512) NULL,
    `cycleDays` INTEGER NOT NULL DEFAULT 7,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planId` INTEGER NOT NULL,
    `dayNumber` INTEGER NOT NULL,
    `dayName` VARCHAR(32) NOT NULL DEFAULT 'Day 1',

    UNIQUE INDEX `TrainingDay_planId_dayNumber_key`(`planId`, `dayNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exercise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trainingDayId` INTEGER NOT NULL,
    `exerciseName` VARCHAR(128) NOT NULL,
    `sets` INTEGER NOT NULL DEFAULT 3,
    `reps` INTEGER NOT NULL DEFAULT 12,
    `restSeconds` INTEGER NOT NULL DEFAULT 60,
    `videoUrl` VARCHAR(512) NULL,
    `imageUrl` VARCHAR(512) NULL,
    `description` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `Exercise_trainingDayId_idx`(`trainingDayId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserTrainingPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `planId` INTEGER NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `goalDescription` TEXT NULL,
    `targetWeight` DOUBLE NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserTrainingPlan_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyCheckin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `planId` INTEGER NULL,
    `exerciseId` INTEGER NULL,
    `trainingDayId` INTEGER NULL,
    `checkinDate` DATE NOT NULL,
    `completedSets` INTEGER NOT NULL DEFAULT 0,
    `completedReps` INTEGER NOT NULL DEFAULT 0,
    `durationMinutes` INTEGER NOT NULL DEFAULT 0,
    `feelingRating` INTEGER NOT NULL DEFAULT 3,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DailyCheckin_userId_checkinDate_idx`(`userId`, `checkinDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExerciseLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checkinId` INTEGER NOT NULL,
    `exerciseId` INTEGER NOT NULL,
    `setNumber` INTEGER NOT NULL DEFAULT 1,
    `weight` DOUBLE NULL,
    `reps` INTEGER NOT NULL DEFAULT 0,
    `completed` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ExerciseLog_checkinId_idx`(`checkinId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoodDatabase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `foodName` VARCHAR(128) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `caloriesPer100g` DOUBLE NOT NULL,
    `proteinG` DOUBLE NOT NULL DEFAULT 0,
    `fatG` DOUBLE NOT NULL DEFAULT 0,
    `carbsG` DOUBLE NOT NULL DEFAULT 0,
    `servingUnit` VARCHAR(16) NOT NULL DEFAULT 'g',

    INDEX `FoodDatabase_foodName_idx`(`foodName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DietRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `foodId` INTEGER NOT NULL,
    `servingAmount` DOUBLE NOT NULL DEFAULT 100,
    `mealType` VARCHAR(16) NOT NULL,
    `recordDate` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DietRecord_userId_recordDate_mealType_idx`(`userId`, `recordDate`, `mealType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DietPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `goal` VARCHAR(32) NOT NULL,
    `dailyCalories` INTEGER NOT NULL,
    `proteinTargetG` DOUBLE NOT NULL,
    `fatTargetG` DOUBLE NOT NULL,
    `carbsTargetG` DOUBLE NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DietPlan_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Achievement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `description` VARCHAR(256) NOT NULL,
    `icon` VARCHAR(32) NOT NULL,
    `conditionType` VARCHAR(32) NOT NULL,
    `conditionValue` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAchievement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `achievementId` INTEGER NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserAchievement_userId_achievementId_key`(`userId`, `achievementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPoint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `reason` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserPoint_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RefreshToken_token_key`(`token`),
    INDEX `RefreshToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostureAssessment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `assessmentDate` DATE NOT NULL,
    `postureType` VARCHAR(64) NOT NULL,
    `severity` VARCHAR(16) NOT NULL,
    `testDataJson` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostureCorrectionPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assessmentId` INTEGER NOT NULL,
    `exerciseName` VARCHAR(128) NOT NULL,
    `frequency` VARCHAR(64) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `videoUrl` VARCHAR(512) NULL,
    `imageUrl` VARCHAR(512) NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BodyRecord` ADD CONSTRAINT `BodyRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingDay` ADD CONSTRAINT `TrainingDay_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `TrainingPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exercise` ADD CONSTRAINT `Exercise_trainingDayId_fkey` FOREIGN KEY (`trainingDayId`) REFERENCES `TrainingDay`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTrainingPlan` ADD CONSTRAINT `UserTrainingPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTrainingPlan` ADD CONSTRAINT `UserTrainingPlan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `TrainingPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyCheckin` ADD CONSTRAINT `DailyCheckin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExerciseLog` ADD CONSTRAINT `ExerciseLog_checkinId_fkey` FOREIGN KEY (`checkinId`) REFERENCES `DailyCheckin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DietRecord` ADD CONSTRAINT `DietRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DietRecord` ADD CONSTRAINT `DietRecord_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `FoodDatabase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DietPlan` ADD CONSTRAINT `DietPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPoint` ADD CONSTRAINT `UserPoint_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
