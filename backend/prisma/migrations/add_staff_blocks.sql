-- Tabella per blocchi orari dello staff (vacanze, assenze, etc.)
CREATE TABLE IF NOT EXISTS "staff_blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK (type IN ('VACATION', 'SICK_LEAVE', 'TRAINING', 'OTHER')),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_blocks_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS "staff_blocks_staffId_idx" ON "staff_blocks" ("staffId");
CREATE INDEX IF NOT EXISTS "staff_blocks_date_range_idx" ON "staff_blocks" ("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "staff_blocks_type_idx" ON "staff_blocks" ("type");
