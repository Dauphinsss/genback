/*
  Warnings:

  - You are about to drop the column `htmlFileUrl` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Content" DROP COLUMN "htmlFileUrl",
ADD COLUMN     "blocksJson" JSONB;
