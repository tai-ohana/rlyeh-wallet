-- 017: Monetization model refactor
-- Pro: subscription → one-time purchase (買い切り)
-- New tier: 'supporter' (monthly subscription for matching + ad-free)
-- Streamer: unchanged (includes all features during subscription)

-- =============================================
-- Step 1: Add Pro purchase columns
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pro_purchased_at') THEN
    ALTER TABLE public.profiles ADD COLUMN pro_purchased_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pro_purchase_stripe_payment_id') THEN
    ALTER TABLE public.profiles ADD COLUMN pro_purchase_stripe_payment_id TEXT DEFAULT NULL;
  END IF;
END $$;

-- Index for Pro purchase lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pro_purchased
  ON public.profiles(pro_purchased_at)
  WHERE pro_purchased_at IS NOT NULL;

-- =============================================
-- Step 2: Migrate existing Pro subscribers to permanent Pro
-- (Must happen BEFORE constraint change since 'pro' is still valid)
-- =============================================
UPDATE public.profiles
SET
  pro_purchased_at = NOW(),
  former_tier = NULL
WHERE tier = 'pro';

-- Set tier to 'free' for former Pro subscribers
-- (They now have permanent Pro via pro_purchased_at)
UPDATE public.profiles
SET tier = 'free'
WHERE tier = 'pro';

-- =============================================
-- Step 3: Update tier CHECK constraint
-- Old: ('free', 'pro', 'streamer')
-- New: ('free', 'supporter', 'streamer')
-- =============================================

-- Drop old constraint (name may vary depending on how it was created)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the CHECK constraint on the tier column
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
  WHERE con.conrelid = 'public.profiles'::regclass
    AND att.attname = 'tier'
    AND con.contype = 'c';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Add new constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('free', 'supporter', 'streamer'));

-- =============================================
-- Step 4: Update former_tier CHECK constraint
-- Old: ('pro', 'streamer')
-- New: ('pro', 'supporter', 'streamer')
-- =============================================
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
  WHERE con.conrelid = 'public.profiles'::regclass
    AND att.attname = 'former_tier'
    AND con.contype = 'c';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_former_tier_check
  CHECK (former_tier IS NULL OR former_tier IN ('pro', 'supporter', 'streamer'));
