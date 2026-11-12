
-- DropForeignKey
ALTER TABLE "TrackAssignment" DROP CONSTRAINT "TrackAssignment_classId_fkey";

-- DropForeignKey
ALTER TABLE "TrackAssignment" DROP CONSTRAINT "TrackAssignment_trackId_fkey";

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "courseId" TEXT;

-- DropTable
DROP TABLE "TrackAssignment";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAssignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_organizationId_slug_key" ON "Course"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAssignment_classId_courseId_key" ON "CourseAssignment"("classId", "courseId");

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

