/*
  Warnings:

  - You are about to drop the column `lessonId` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the `CourseTopics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CourseTopics" DROP CONSTRAINT "CourseTopics_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseTopics" DROP CONSTRAINT "CourseTopics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Topic" DROP CONSTRAINT "Topic_lessonId_fkey";

-- AlterTable
ALTER TABLE "public"."Topic" DROP COLUMN "lessonId";

-- DropTable
DROP TABLE "public"."CourseTopics";

-- CreateTable
CREATE TABLE "public"."LessonTopic" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonTopic_lessonId_topicId_key" ON "public"."LessonTopic"("lessonId", "topicId");

-- AddForeignKey
ALTER TABLE "public"."LessonTopic" ADD CONSTRAINT "LessonTopic_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonTopic" ADD CONSTRAINT "LessonTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
