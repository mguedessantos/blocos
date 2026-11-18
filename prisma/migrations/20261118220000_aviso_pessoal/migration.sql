-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "userIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

