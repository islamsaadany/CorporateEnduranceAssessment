-- Migration 004: 4-tier Level enum + demographicsCompletedAt timestamp.
--
-- WHAT THIS DOES:
--   1. Recreates the Level enum with 4 merged tiers (was 5).
--      Old → new mapping:
--        executive             → senior_leader (label: "Senior Leader / Executive")
--        senior_leader         → senior_leader (label: "Senior Leader / Executive")
--        manager               → manager       (label: "Manager / Department Head")
--        team_lead             → team_leader   (label: "Team Leader / Supervisor")
--        individual_contributor → individual_contributor
--                                              (label: "Individual Contributor / Early Career")
--   2. Adds Respondent.demographicsCompletedAt and backfills it for any
--      existing respondents that already have departmentId + level + tenure
--      set (so existing sample data behaves correctly).
--   3. Adds an index on (assessmentId, demographicsCompletedAt) for the
--      "count demographics-completed respondents" lookup the cap check
--      and admin detail page now run.
--
-- WHY: per the 2026-04-29 decisions-log entry "Levels + demographics".
-- The 5-tier Level taxonomy was redundant for senior-leadership
-- audiences; the merged 4-tier list matches the original methodology
-- reference. demographicsCompletedAt distinguishes real respondents
-- from ghost validations that never finished demographics.
--
-- IDEMPOTENT: rerunning is a no-op once the new enum is in place.
--
-- ────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Add demographicsCompletedAt + backfill
ALTER TABLE "Respondent" ADD COLUMN IF NOT EXISTS "demographicsCompletedAt" TIMESTAMP(3);

UPDATE "Respondent"
   SET "demographicsCompletedAt" = "createdAt"
 WHERE "demographicsCompletedAt" IS NULL
   AND "departmentId" IS NOT NULL
   AND "level" IS NOT NULL
   AND "tenure" IS NOT NULL;

-- ── 2. Recreate Level enum with new 4-tier values + remap existing rows
-- Skip the recreate entirely if the new enum is already in place
-- (i.e., the values already match the new set).
DO $$
DECLARE
  has_old_executive BOOLEAN;
  has_old_team_lead BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'Level' AND e.enumlabel = 'executive'
  ) INTO has_old_executive;

  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'Level' AND e.enumlabel = 'team_lead'
  ) INTO has_old_team_lead;

  IF has_old_executive OR has_old_team_lead THEN
    -- Step 1: rename old enum out of the way
    ALTER TYPE "Level" RENAME TO "Level_old";

    -- Step 2: create new enum with the 4-tier values
    CREATE TYPE "Level" AS ENUM (
      'individual_contributor',
      'team_leader',
      'manager',
      'senior_leader'
    );

    -- Step 3: alter the column with explicit value mapping. NULL stays NULL.
    ALTER TABLE "Respondent" ALTER COLUMN "level" TYPE "Level"
      USING (
        CASE "level"::text
          WHEN 'executive'              THEN 'senior_leader'::"Level"
          WHEN 'senior_leader'          THEN 'senior_leader'::"Level"
          WHEN 'manager'                THEN 'manager'::"Level"
          WHEN 'team_lead'              THEN 'team_leader'::"Level"
          WHEN 'individual_contributor' THEN 'individual_contributor'::"Level"
        END
      );

    -- Step 4: drop the old enum
    DROP TYPE "Level_old";
  END IF;
END $$;

-- ── 3. Add the (assessmentId, demographicsCompletedAt) index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname = 'Respondent_assessmentId_demographicsCompletedAt_idx'
  ) THEN
    EXECUTE 'CREATE INDEX "Respondent_assessmentId_demographicsCompletedAt_idx" ON "Respondent"("assessmentId", "demographicsCompletedAt")';
  END IF;
END $$;

COMMIT;

-- ────────────────────────────────────────────────────────────────────
-- POST-MIGRATION VERIFICATION (paste into Neon SQL editor as needed):
--
--   -- Confirm the new enum:
--   SELECT enumlabel FROM pg_enum
--    WHERE enumtypid = '"Level"'::regtype
--    ORDER BY enumsortorder;
--   -- Expect: individual_contributor, team_leader, manager, senior_leader
--
--   -- Confirm demographicsCompletedAt is backfilled where appropriate:
--   SELECT
--     COUNT(*) FILTER (WHERE "demographicsCompletedAt" IS NOT NULL) AS "completed",
--     COUNT(*) FILTER (WHERE "demographicsCompletedAt" IS NULL)     AS "ghost"
--   FROM "Respondent";
--
-- ────────────────────────────────────────────────────────────────────
