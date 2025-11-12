-- CreateTable
CREATE TABLE "public"."HistoricContent" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "performedBy" TEXT NOT NULL,
    "changeSummary" TEXT,
    "snapshotDescription" TEXT,
    "snapshotBlocksJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."HistoricContent" ADD CONSTRAINT "HistoricContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
