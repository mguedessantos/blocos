-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "maxTeachers" INTEGER;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "extraStudents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inactivityNoticeAt" TIMESTAMP(3),
ADD COLUMN     "keptActiveAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PlanAddon" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "students" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "stripePriceId" TEXT,

    CONSTRAINT "PlanAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanAddon_stripePriceId_key" ON "PlanAddon"("stripePriceId");

-- AddForeignKey
ALTER TABLE "PlanAddon" ADD CONSTRAINT "PlanAddon_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Escola e Escola+ viram um único plano "escola" (com white-label).
UPDATE "Subscription" SET "planId" = 'escola' WHERE "planId" = 'escola_plus' AND EXISTS (SELECT 1 FROM "Plan" WHERE id = 'escola');
DELETE FROM "Plan" WHERE id = 'escola_plus' AND NOT EXISTS (SELECT 1 FROM "Subscription" WHERE "planId" = 'escola_plus');
