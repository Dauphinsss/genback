/*
  Warnings:

  - You are about to drop the column `blocksJson` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Content" DROP COLUMN "blocksJson",
ADD COLUMN     "jsonFileUrl" TEXT;
