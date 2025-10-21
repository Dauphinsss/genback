/*
  Warnings:

  - You are about to drop the column `htmlContent` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Content" DROP COLUMN "htmlContent",
ADD COLUMN     "htmlFileUrl" TEXT;
