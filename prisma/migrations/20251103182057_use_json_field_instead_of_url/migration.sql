/*
  Warnings:

  - You are about to drop the column `jsonFileUrl` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Content" DROP COLUMN "jsonFileUrl",
ADD COLUMN     "blocksJson" JSONB;
