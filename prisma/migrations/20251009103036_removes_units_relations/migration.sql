/*
  Warnings:

  - You are about to drop the column `activeUnitId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Unit` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "id_teacher" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Sin título',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Course_id_teacher_fkey" FOREIGN KEY ("id_teacher") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("code", "createdAt", "id", "id_teacher", "title") SELECT "code", "createdAt", "id", "id_teacher", "title" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE TABLE "new_Unit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Unit" ("createdAt", "id", "index", "published", "title") SELECT "createdAt", "id", "index", "published", "title" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE UNIQUE INDEX "Unit_index_key" ON "Unit"("index");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
