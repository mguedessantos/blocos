-- AlterTable
ALTER TABLE "GameJam" ADD COLUMN     "nextSteps" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "resultsSentAt" TIMESTAMP(3);

