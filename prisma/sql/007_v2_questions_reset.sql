-- ─── V2 Questions Reset ──────────────────────────────────────────────
--
-- The assessment moved from the 30-question / 15-capability framework
-- (v0.1) to the 42-question / 21-capability V2 framework. Question IDs
-- changed shape from "1a..15b" to "1a..21b" and some old capabilities
-- were split / renamed / moved across pillars, so existing Response
-- rows no longer map cleanly to V2 capabilities.
--
-- This migration:
--   1. Deletes every Response row (production answers + sample data).
--   2. Clears submittedAt + startedAt on every Respondent so any
--      in-flight respondents restart on the new 42-question set.
--   3. Deletes every cached GeneratedReport row (numerical aggregates
--      and AI output were both computed against the old framework).
--   4. Leaves Assessment, Department, Admin, Settings, and Audit Log
--      rows untouched.
--
-- Paste this in the Neon SQL editor BEFORE pasting the regenerated
-- 001_seed_sample_data.sql and 006_acme_sample_data.sql files. Those
-- two re-insert sample respondents + responses with V2 question IDs.
--
-- IDEMPOTENT: safe to run multiple times. After the first run, the
-- second has nothing to clear.

BEGIN;

-- 1. Wipe all responses
DELETE FROM "Response";

-- 2. Unsubmit and unstart all respondents (demographics + names preserved)
UPDATE "Respondent" SET "submittedAt" = NULL, "startedAt" = NULL;

-- 3. Wipe cached AI/numerical reports (only present once GeneratedReport
--    table exists from Phase 7+; the IF EXISTS keeps this safe pre-Phase-7)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'GeneratedReport') THEN
    EXECUTE 'DELETE FROM "GeneratedReport"';
  END IF;
END $$;

-- 4. Verification — all three should return 0
SELECT
  (SELECT COUNT(*) FROM "Response") AS responses_remaining,
  (SELECT COUNT(*) FROM "Respondent" WHERE "submittedAt" IS NOT NULL) AS submitted_respondents_remaining;

COMMIT;
