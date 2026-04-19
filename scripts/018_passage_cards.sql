-- 018: Passage Cards (通過カード) Schema
-- Users can create passage cards from their session records.
-- Paid users' cards get promoted as ads to other users who completed the same scenario.

-- =============================================
-- passage_cards: 通過カード本体
-- =============================================
CREATE TABLE IF NOT EXISTS public.passage_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  scenario_author TEXT,
  card_style TEXT DEFAULT 'default' CHECK (card_style IN ('default', 'elegant', 'dark', 'cosmic')),
  custom_message TEXT CHECK (custom_message IS NULL OR LENGTH(custom_message) <= 140),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One passage card per report
  UNIQUE(play_report_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_passage_cards_user
  ON public.passage_cards(user_id);

CREATE INDEX IF NOT EXISTS idx_passage_cards_scenario
  ON public.passage_cards(scenario_name);

CREATE INDEX IF NOT EXISTS idx_passage_cards_active
  ON public.passage_cards(is_active)
  WHERE is_active = TRUE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_passage_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS passage_cards_updated_at ON public.passage_cards;
CREATE TRIGGER passage_cards_updated_at
  BEFORE UPDATE ON public.passage_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_passage_cards_updated_at();

-- =============================================
-- passage_card_impressions: 広告表示トラッキング
-- =============================================
CREATE TABLE IF NOT EXISTS public.passage_card_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_card_id UUID NOT NULL REFERENCES public.passage_cards(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  impression_type TEXT NOT NULL CHECK (impression_type IN ('view', 'click', 'dismiss')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_passage_card_impressions_card
  ON public.passage_card_impressions(passage_card_id);

CREATE INDEX IF NOT EXISTS idx_passage_card_impressions_date
  ON public.passage_card_impressions(created_at);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.passage_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passage_card_impressions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for passage_cards
-- =============================================

-- Anyone can view active passage cards (for display in feeds)
CREATE POLICY "passage_cards_select_public"
  ON public.passage_cards
  FOR SELECT
  USING (true);

-- Users can insert their own passage cards
CREATE POLICY "passage_cards_insert_own"
  ON public.passage_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own passage cards
CREATE POLICY "passage_cards_update_own"
  ON public.passage_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own passage cards
CREATE POLICY "passage_cards_delete_own"
  ON public.passage_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for passage_card_impressions
-- =============================================

-- Anyone can insert impressions (for tracking)
CREATE POLICY "passage_card_impressions_insert"
  ON public.passage_card_impressions
  FOR INSERT
  WITH CHECK (true);

-- Card owners can view impressions on their own cards
CREATE POLICY "passage_card_impressions_select_own"
  ON public.passage_card_impressions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.passage_cards
      WHERE id = passage_card_id AND user_id = auth.uid()
    )
  );
