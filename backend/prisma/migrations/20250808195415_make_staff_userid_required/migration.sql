/*
  Warnings:

  - Made the column `userId` on table `staff` required. This step will fail if there are existing NULL values in that column.

*/

-- First, create user accounts for existing staff members without one
INSERT INTO "users" ("id", "email", "firstName", "lastName", "phone", "password", "role", "isVerified", "createdAt", "updatedAt")
SELECT 
  'user_' || "id" as id,
  "email",
  "firstName", 
  "lastName",
  "phone",
  '$2b$10$wduGnx8AKwugILUqCd0xtesWRKzUnXqBvq/8dfleZ/jWuIa67rxXS' as password, -- kinetica123
  'STAFF' as role,
  1 as isVerified,
  "createdAt",
  "updatedAt"
FROM "staff" 
WHERE "userId" IS NULL;

-- Update staff records to link to the new user accounts
UPDATE "staff" 
SET "userId" = 'user_' || "id"
WHERE "userId" IS NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "specialization" TEXT NOT NULL,
    "yearsOfExperience" INTEGER,
    "bio" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workingHours" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_staff" ("avatar", "bio", "createdAt", "email", "firstName", "id", "isActive", "lastName", "phone", "specialization", "updatedAt", "userId", "workingHours", "yearsOfExperience") SELECT "avatar", "bio", "createdAt", "email", "firstName", "id", "isActive", "lastName", "phone", "specialization", "updatedAt", "userId", "workingHours", "yearsOfExperience" FROM "staff";
DROP TABLE "staff";
ALTER TABLE "new_staff" RENAME TO "staff";
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
