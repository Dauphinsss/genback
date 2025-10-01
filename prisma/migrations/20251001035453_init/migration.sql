-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT
);

-- CreateTable
CREATE TABLE "Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "id_teacher" INTEGER NOT NULL,
    CONSTRAINT "Course_id_teacher_fkey" FOREIGN KEY ("id_teacher") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseStudent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_course" INTEGER NOT NULL,
    "id_student" INTEGER NOT NULL,
    CONSTRAINT "CourseStudent_id_course_fkey" FOREIGN KEY ("id_course") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CourseStudent_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CourseStudent_id_course_id_student_key" ON "CourseStudent"("id_course", "id_student");
