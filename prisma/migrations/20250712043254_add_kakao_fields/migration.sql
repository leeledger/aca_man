-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "academyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "kakaoAccessToken" TEXT,
    "kakaoRefreshToken" TEXT,
    "kakaoId" TEXT,
    "isKakaoLinked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "users_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("academyId", "createdAt", "email", "id", "isApproved", "name", "password", "role", "updatedAt") SELECT "academyId", "createdAt", "email", "id", "isApproved", "name", "password", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
