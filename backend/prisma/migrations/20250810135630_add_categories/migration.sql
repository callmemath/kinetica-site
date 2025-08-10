/*
  Warnings:

  - You are about to drop the column `name` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `categories` table. All the data in the column will be lost.
  - Added the required column `value` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3da4db',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Migra i dati esistenti mappando name -> value e label -> label
INSERT INTO "new_categories" ("id", "value", "label", "color", "isActive", "createdAt", "updatedAt") 
SELECT 
    "id", 
    LOWER(REPLACE("name", ' ', '_')) as "value",
    "label", 
    COALESCE("color", '#3da4db') as "color",
    COALESCE("isActive", true) as "isActive",
    COALESCE("createdAt", CURRENT_TIMESTAMP) as "createdAt",
    COALESCE("updatedAt", CURRENT_TIMESTAMP) as "updatedAt"
FROM "categories";

DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE UNIQUE INDEX "categories_value_key" ON "categories"("value");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
