-- 019: Update server-side tier limit triggers for new monetization model
-- Now checks BOTH pro_purchased_at (one-time purchase) AND tier (subscription)
-- Pro purchase OR supporter/streamer subscription = limits lifted

-- =============================================
-- Function: Check image count limit per report
-- =============================================
CREATE OR REPLACE FUNCTION check_image_limit()
RETURNS TRIGGER AS $$
DECLARE
  report_owner_id UUID;
  owner_tier TEXT;
  owner_pro_purchased TIMESTAMPTZ;
  current_count INT;
  max_allowed INT;
BEGIN
  -- Get report owner
  SELECT user_id INTO report_owner_id
  FROM public.play_reports
  WHERE id = NEW.play_report_id;

  -- Get owner's tier and pro purchase status
  SELECT COALESCE(tier, 'free'), pro_purchased_at
  INTO owner_tier, owner_pro_purchased
  FROM public.profiles
  WHERE id = report_owner_id;

  -- Pro purchased or paid subscription = unlimited
  IF owner_tier != 'free' OR owner_pro_purchased IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Count existing images for this report
  SELECT COUNT(*) INTO current_count
  FROM public.play_report_images
  WHERE play_report_id = NEW.play_report_id;

  -- Free tier limit
  max_allowed := 5;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Image limit reached for free tier (max: %)', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS enforce_image_limit ON public.play_report_images;
CREATE TRIGGER enforce_image_limit
  BEFORE INSERT ON public.play_report_images
  FOR EACH ROW
  EXECUTE FUNCTION check_image_limit();

-- =============================================
-- Function: Check link count limit per report
-- =============================================
CREATE OR REPLACE FUNCTION check_link_limit()
RETURNS TRIGGER AS $$
DECLARE
  report_owner_id UUID;
  owner_tier TEXT;
  owner_pro_purchased TIMESTAMPTZ;
  current_count INT;
  max_allowed INT;
BEGIN
  SELECT user_id INTO report_owner_id
  FROM public.play_reports
  WHERE id = NEW.play_report_id;

  SELECT COALESCE(tier, 'free'), pro_purchased_at
  INTO owner_tier, owner_pro_purchased
  FROM public.profiles
  WHERE id = report_owner_id;

  IF owner_tier != 'free' OR owner_pro_purchased IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.play_report_links
  WHERE play_report_id = NEW.play_report_id;

  max_allowed := 5;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Link limit reached for free tier (max: %)', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_link_limit ON public.play_report_links;
CREATE TRIGGER enforce_link_limit
  BEFORE INSERT ON public.play_report_links
  FOR EACH ROW
  EXECUTE FUNCTION check_link_limit();

-- =============================================
-- Function: Check tag count limit per report
-- =============================================
CREATE OR REPLACE FUNCTION check_tag_limit()
RETURNS TRIGGER AS $$
DECLARE
  report_owner_id UUID;
  owner_tier TEXT;
  owner_pro_purchased TIMESTAMPTZ;
  current_count INT;
  max_allowed INT;
BEGIN
  SELECT user_id INTO report_owner_id
  FROM public.play_reports
  WHERE id = NEW.play_report_id;

  SELECT COALESCE(tier, 'free'), pro_purchased_at
  INTO owner_tier, owner_pro_purchased
  FROM public.profiles
  WHERE id = report_owner_id;

  SELECT COUNT(*) INTO current_count
  FROM public.report_tags
  WHERE play_report_id = NEW.play_report_id;

  -- Free: 1, Pro purchase / paid subscription: 5
  IF owner_tier = 'free' AND owner_pro_purchased IS NULL THEN
    max_allowed := 1;
  ELSE
    max_allowed := 5;
  END IF;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Tag limit reached (max: %)', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_tag_limit ON public.report_tags;
CREATE TRIGGER enforce_tag_limit
  BEFORE INSERT ON public.report_tags
  FOR EACH ROW
  EXECUTE FUNCTION check_tag_limit();

-- =============================================
-- Function: Check impression text length
-- =============================================
CREATE OR REPLACE FUNCTION check_impression_length()
RETURNS TRIGGER AS $$
DECLARE
  owner_tier TEXT;
  owner_pro_purchased TIMESTAMPTZ;
  max_length INT;
BEGIN
  SELECT COALESCE(tier, 'free'), pro_purchased_at
  INTO owner_tier, owner_pro_purchased
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Free (no pro purchase): 500 chars, otherwise unlimited
  IF owner_tier = 'free' AND owner_pro_purchased IS NULL THEN
    max_length := 500;
    IF NEW.impression IS NOT NULL AND LENGTH(NEW.impression) > max_length THEN
      RAISE EXCEPTION 'Impression length exceeds limit for free tier (max: % chars)', max_length;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_impression_length ON public.play_reports;
CREATE TRIGGER enforce_impression_length
  BEFORE INSERT OR UPDATE ON public.play_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_impression_length();

-- =============================================
-- Function: Check follow limit
-- =============================================
CREATE OR REPLACE FUNCTION check_follow_limit()
RETURNS TRIGGER AS $$
DECLARE
  follower_tier TEXT;
  follower_pro_purchased TIMESTAMPTZ;
  current_count INT;
  max_allowed INT;
BEGIN
  SELECT COALESCE(tier, 'free'), pro_purchased_at
  INTO follower_tier, follower_pro_purchased
  FROM public.profiles
  WHERE id = NEW.follower_id;

  -- Any paid status = unlimited
  IF follower_tier != 'free' OR follower_pro_purchased IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.follows
  WHERE follower_id = NEW.follower_id;

  max_allowed := 100;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Follow limit reached for free tier (max: %)', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if follows table exists before creating trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'follows') THEN
    DROP TRIGGER IF EXISTS enforce_follow_limit ON public.follows;
    CREATE TRIGGER enforce_follow_limit
      BEFORE INSERT ON public.follows
      FOR EACH ROW
      EXECUTE FUNCTION check_follow_limit();
  END IF;
END $$;
