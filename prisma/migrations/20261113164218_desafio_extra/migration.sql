-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "extraChecks" JSONB;

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "extraDone" BOOLEAN NOT NULL DEFAULT false;

