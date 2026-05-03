-- ─── Reset super-admin password ──────────────────────────────────────
--
-- Use this when the super admin password needs to be (re)set and
-- `npm run seed` is not available (no local terminal).
--
-- HOW TO USE:
--   1. Replace the placeholder strings below with the actual values.
--   2. Paste this whole file into Neon's SQL editor.
--   3. Run it. The verification SELECT at the bottom should return
--      exactly one row with the correct email and a hash that begins
--      with "$2a$" or "$2b$".
--
-- SECURITY:
--   The plaintext password appears once in the SQL you paste. It is
--   hashed by pgcrypto inside the database and never stored as plain
--   text. After running this, clear the SQL editor history if your
--   browser/Neon retains it.
--
-- COMPATIBILITY:
--   pgcrypto's crypt(password, gen_salt('bf', 10)) produces a $2a$
--   bcrypt hash. The app uses bcryptjs's compare(), which accepts both
--   $2a$ and $2b$ formats — no migration needed.
--
-- Idempotent: re-running this with the same password produces a new
-- hash (different salt) but the password verifies the same way.

-- pgcrypto is the standard PostgreSQL extension for bcrypt. Neon has
-- it available; this is a no-op if it's already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Replace these two values before running ─────────────────────────
--   - Email: the super-admin row to update. Default seed value below.
--   - Password: pick something strong; this is what you'll log in with.
UPDATE "Admin"
SET    "passwordHash" = crypt('REPLACE_WITH_YOUR_NEW_PASSWORD', gen_salt('bf', 10)),
       "isActive"     = TRUE,
       "updatedAt"    = NOW()
WHERE  "email" = 'superadmin@forefront.example';

-- Verify: should return 1 row with role='super_admin', isActive=true,
-- and a hash_prefix starting with "$2a$" or "$2b$".
SELECT "email",
       "role",
       "isActive",
       LEFT("passwordHash", 7) AS hash_prefix,
       "updatedAt"
FROM   "Admin"
WHERE  "email" = 'superadmin@forefront.example';
