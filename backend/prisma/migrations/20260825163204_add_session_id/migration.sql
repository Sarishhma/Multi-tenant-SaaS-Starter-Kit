ALTER TABLE "RefreshToken"
ADD COLUMN "sessionId" TEXT;

UPDATE "RefreshToken"
SET "sessionId" = gen_random_uuid()::text
WHERE "sessionId" IS NULL;

ALTER TABLE "RefreshToken"
ALTER COLUMN "sessionId" SET NOT NULL;

CREATE INDEX "RefreshToken_sessionId_idx"
ON "RefreshToken"("sessionId");