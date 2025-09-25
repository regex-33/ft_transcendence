/*
  Warnings:

  - Added the required column `avatar` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN "winningTeam" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL,
    "avatar" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 150,
    "activeGameId" TEXT,
    CONSTRAINT "Player_activeGameId_fkey" FOREIGN KEY ("activeGameId") REFERENCES "Game" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("activeGameId", "points", "updatedAt", "userId") SELECT "activeGameId", "points", "updatedAt", "userId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE INDEX "Player_activeGameId_idx" ON "Player"("activeGameId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
