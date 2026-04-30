-- Migration 003: switch from 1–5 Likert to 1–4 Likert + "I don't know".
--
-- WHAT THIS DOES:
--   1. Drops the NOT NULL constraint on "Response"."value" so NULL means
--      "I don't know" (a deliberate non-answer that still counts toward
--      submission completeness but is excluded from scoring).
--   2. Clamps any existing 5-valued answers down to 4. The legacy 5-point
--      Likert had 4=Agree and 5=Strongly Agree; mapping 5→4 collapses both
--      onto "Agree" — the closest valid value on the new 1–4 scale.
--   3. Adds a CHECK constraint enforcing the new range (1..4 OR NULL).
--
-- WHY: per the 2026-04-29 decisions-log entry "Likert scale". Removes the
-- midpoint (no more "3 = Neutral") to reduce central-tendency bias, and
-- adds an explicit "I don't know" so respondents who genuinely lack
-- information don't have to fake an answer.
--
-- This migration is IDEMPOTENT.
--
-- ────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Clamp any 5s → 4 BEFORE we add the CHECK constraint
UPDATE "Response" SET "value" = 4 WHERE "value" = 5;

-- 2. Drop NOT NULL on value
ALTER TABLE "Response" ALTER COLUMN "value" DROP NOT NULL;

-- 3. Add CHECK (value IS NULL OR value BETWEEN 1 AND 4)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'Response_value_range_check'
  ) THEN
    EXECUTE 'ALTER TABLE "Response" ADD CONSTRAINT "Response_value_range_check" CHECK ("value" IS NULL OR ("value" BETWEEN 1 AND 4))';
  END IF;
END $$;

COMMIT;

-- ────────────────────────────────────────────────────────────────────
-- POST-MIGRATION VERIFICATION (paste into Neon SQL editor as needed):
--
--   -- Confirm no values outside 1..4:
--   SELECT DISTINCT "value" FROM "Response" ORDER BY "value" NULLS FIRST;
--
--   -- Confirm the CHECK constraint exists:
--   SELECT conname FROM pg_constraint WHERE conname = 'Response_value_range_check';
--
-- ────────────────────────────────────────────────────────────────────
