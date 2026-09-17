/*
  Warnings:

  - Added the required column `familyId` to the `RefreshToken` table.
*/

-- 1. Add familyId as nullable temporarily
ALTER TABLE "RefreshToken"
ADD COLUMN "familyId" TEXT;

-- 2. Add replacedAt
ALTER TABLE "RefreshToken"
ADD COLUMN "replacedAt" TIMESTAMP(3);

-- 3. Give existing refresh tokens a family ID
UPDATE "RefreshToken"
SET "familyId" = gen_random_uuid()::text
WHERE "familyId" IS NULL;

-- 4. Make familyId required
ALTER TABLE "RefreshToken"
ALTER COLUMN "familyId" SET NOT NULL;

-- 5. Add index
CREATE INDEX "RefreshToken_familyId_idx"
ON "RefreshToken"("familyId");