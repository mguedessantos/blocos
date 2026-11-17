-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "extra",
DROP COLUMN "extraChecks",
DROP COLUMN "mode",
DROP COLUMN "optional";

-- AlterTable
ALTER TABLE "Progress" DROP COLUMN "extraDone";

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "sb3Url";

-- DropEnum
DROP TYPE "LessonMode";

