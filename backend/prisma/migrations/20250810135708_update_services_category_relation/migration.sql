/*
  - Changed the `category` column in `services` from TEXT to foreign key reference to categories table
  - The services table will use categoryId to reference categories
*/

-- First, add the new categoryId column
ALTER TABLE "services" ADD COLUMN "categoryId" TEXT;

-- Update existing services to link with categories based on category string values
UPDATE "services" 
SET "categoryId" = (
    SELECT "id" 
    FROM "categories" 
    WHERE LOWER("categories"."value") = LOWER("services"."category")
    OR LOWER("categories"."label") = LOWER("services"."category")
    LIMIT 1
);

-- Make categoryId required and add foreign key constraint
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3da4db',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availability" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_services" ("availability", "categoryId", "color", "createdAt", "description", "duration", "id", "isActive", "name", "price", "updatedAt") 
SELECT "availability", "categoryId", "color", "createdAt", "description", "duration", "id", "isActive", "name", "price", "updatedAt" FROM "services";

DROP TABLE "services";
ALTER TABLE "new_services" RENAME TO "services";
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;