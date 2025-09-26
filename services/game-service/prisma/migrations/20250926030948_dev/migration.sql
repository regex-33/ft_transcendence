-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "winnerId" INTEGER,
    CONSTRAINT "Tournament_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Player" ("userId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("createdAt", "id", "status", "updatedAt", "winnerId") SELECT "createdAt", "id", "status", "updatedAt", "winnerId" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_winnerId_idx" ON "Tournament"("winnerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
