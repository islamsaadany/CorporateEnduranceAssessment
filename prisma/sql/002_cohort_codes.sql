-- Migration 002: switch from per-respondent codes to a cohort code per assessment.
--
-- WHAT THIS DOES (in order):
--   1. Adds Assessment.code (unique) and Assessment.maxUses columns.
--   2. Backfills existing assessments with a generated code and a maxUses
--      derived from the current respondent count.
--   3. Drops Respondent.code and its unique index.
--   4. Adds (assessmentId, submittedAt) index on Respondent for the new
--      "count submitted" lookup the validation route runs.
--
-- WHY: the original design had one 6-char code per Respondent, generated
-- in bulk at assessment creation. We're reversing to a cohort-code model
-- (one code per Assessment, every respondent uses the same code) per the
-- 2026-04-29 decisions-log reversal in execution-plan.md.
--
-- This migration is IDEMPOTENT (uses IF NOT EXISTS / IF EXISTS where
-- supported). Safe to re-run.
--
-- ────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Add new Assessment columns (initially nullable so existing rows survive)
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "maxUses" INTEGER;

-- ── 2. Backfill existing assessments
-- For each assessment without a code yet, generate a 6-char cohort code
-- (alphabet excludes 0/O/1/I/L), and set maxUses to the current respondent
-- count (or 8 if there are zero respondents — sensible default).
DO $$
DECLARE
  rec RECORD;
  alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate TEXT;
  attempts INT;
  resp_count INT;
BEGIN
  FOR rec IN SELECT "id" FROM "Assessment" WHERE "code" IS NULL LOOP
    -- Generate a unique 6-char code. Loop until we find one that no
    -- existing assessment has claimed.
    LOOP
      candidate := '';
      FOR i IN 1..6 LOOP
        candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "Assessment" WHERE "code" = candidate);
    END LOOP;

    SELECT COUNT(*) INTO resp_count FROM "Respondent" WHERE "assessmentId" = rec."id";
    IF resp_count = 0 THEN resp_count := 8; END IF;

    UPDATE "Assessment"
       SET "code" = candidate,
           "maxUses" = resp_count
     WHERE "id" = rec."id";
  END LOOP;
END $$;

-- ── 3. Lock the new columns down: NOT NULL + unique on code
ALTER TABLE "Assessment" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Assessment" ALTER COLUMN "maxUses" SET NOT NULL;

-- The unique index name must match what Prisma expects
-- ("Assessment_code_key") so future prisma generates stay aligned.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public' AND indexname = 'Assessment_code_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX "Assessment_code_key" ON "Assessment"("code")';
  END IF;
END $$;

-- ── 4. Drop the old per-respondent code column + its unique index
DROP INDEX IF EXISTS "Respondent_code_key";
ALTER TABLE "Respondent" DROP COLUMN IF EXISTS "code";

-- ── 5. New index for the validation-route "count submitted" lookup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public' AND indexname = 'Respondent_assessmentId_submittedAt_idx'
  ) THEN
    EXECUTE 'CREATE INDEX "Respondent_assessmentId_submittedAt_idx" ON "Respondent"("assessmentId", "submittedAt")';
  END IF;
END $$;

COMMIT;

-- ────────────────────────────────────────────────────────────────────
-- POST-MIGRATION VERIFICATION (paste into Neon SQL editor as needed):
--
--   -- Confirm every assessment now has a code:
--   SELECT "clientName", "code", "maxUses" FROM "Assessment";
--
--   -- Confirm Respondent.code is gone:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'Respondent' AND column_name = 'code';
--   -- (zero rows expected)
--
-- ────────────────────────────────────────────────────────────────────
