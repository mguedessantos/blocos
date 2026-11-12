-- AlterTable
ALTER TABLE "JamEntry" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "JamTeam" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "JamTeamMember" ADD COLUMN     "schoolYear" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "JamCategory" (
    "id" TEXT NOT NULL,
    "jamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minYear" INTEGER NOT NULL,
    "maxYear" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JamCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JamCategory" ADD CONSTRAINT "JamCategory_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "GameJam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamTeam" ADD CONSTRAINT "JamTeam_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JamCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamEntry" ADD CONSTRAINT "JamEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JamCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

