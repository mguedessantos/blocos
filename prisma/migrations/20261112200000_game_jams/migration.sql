-- CreateEnum
CREATE TYPE "PrizeRecipient" AS ENUM ('ESCOLA', 'EQUIPE');

-- CreateEnum
CREATE TYPE "ProjectSource" AS ENUM ('SB3', 'SITE');

-- AlterEnum
BEGIN;
CREATE TYPE "JamScope_new" AS ENUM ('PLATAFORMA', 'ESTADOS', 'CIDADES', 'ESCOLAS');
ALTER TABLE "GameJam" ALTER COLUMN "scope" TYPE "JamScope_new" USING ("scope"::text::"JamScope_new");
ALTER TYPE "JamScope" RENAME TO "JamScope_old";
ALTER TYPE "JamScope_new" RENAME TO "JamScope";
DROP TYPE "public"."JamScope_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "GameJam" DROP CONSTRAINT "GameJam_classId_fkey";

-- DropForeignKey
ALTER TABLE "GameJam" DROP CONSTRAINT "GameJam_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "JamEntry" DROP CONSTRAINT "JamEntry_teamId_fkey";

-- DropIndex
DROP INDEX "JamEntry_teamId_key";

-- AlterTable
ALTER TABLE "GameJam" DROP COLUMN "classId",
DROP COLUMN "organizationId",
DROP COLUMN "popularVote",
DROP COLUMN "rules",
DROP COLUMN "status",
DROP COLUMN "submissionDeadline",
ADD COLUMN     "cities" TEXT[],
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "orgIds" TEXT[],
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "states" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "theme" SET NOT NULL,
ALTER COLUMN "scope" SET DEFAULT 'PLATAFORMA',
ALTER COLUMN "maxTeamSize" SET DEFAULT 4;

-- AlterTable
ALTER TABLE "JamEntry" DROP COLUMN "sb3Url",
DROP COLUMN "teamId",
DROP COLUMN "thumbnailUrl",
ADD COLUMN     "anonCode" TEXT NOT NULL,
ADD COLUMN     "docExt" TEXT NOT NULL,
ADD COLUMN     "docKey" TEXT NOT NULL,
ADD COLUMN     "projectKey" TEXT NOT NULL,
ADD COLUMN     "projectSource" "ProjectSource" NOT NULL DEFAULT 'SB3',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "youtubeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JamFeedback" DROP COLUMN "visibleToStudent",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "JamTeam" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canOrganizeJams" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "JamStatus";

-- CreateTable
CREATE TABLE "JamPrize" (
    "id" TEXT NOT NULL,
    "jamId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "recipient" "PrizeRecipient" NOT NULL DEFAULT 'EQUIPE',

    CONSTRAINT "JamPrize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JamEntryOrigin" (
    "entryId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "JamEntryOrigin_pkey" PRIMARY KEY ("entryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "JamEntryOrigin_teamId_key" ON "JamEntryOrigin"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "JamEntry_jamId_anonCode_key" ON "JamEntry"("jamId", "anonCode");

-- AddForeignKey
ALTER TABLE "JamPrize" ADD CONSTRAINT "JamPrize_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "GameJam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamTeam" ADD CONSTRAINT "JamTeam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamEntryOrigin" ADD CONSTRAINT "JamEntryOrigin_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JamEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamEntryOrigin" ADD CONSTRAINT "JamEntryOrigin_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "JamTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

