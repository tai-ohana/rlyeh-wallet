-- 020: Investigators (探索者) Schema
-- Users can create investigator cards linked to session records.

-- =============================================
-- investigators: 探索者カード本体
-- =============================================
CREATE TABLE IF NOT EXISTS public.investigators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  occupation TEXT,
  age TEXT,
  avatar_url TEXT,
  backstory TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'lost', 'retired')),

  -- Tags (free-form)
  tags TEXT[] DEFAULT '{}',

  -- Stats (extracted from Cocofolia or manual)
  san_current INTEGER,
  san_max INTEGER,
  hp_max INTEGER,
  mp_max INTEGER,

  -- Raw Cocofolia JSON (for reference)
  cocofolia_data JSONB,

  -- Display
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- investigator_sessions: 探索者 ↔ セッション
-- =============================================
CREATE TABLE IF NOT EXISTS public.investigator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigator_id UUID NOT NULL REFERENCES public.investigators(id) ON DELETE CASCADE,
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  result TEXT CHECK (result IN ('survive', 'lost', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(investigator_id, play_report_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investigators_user
  ON public.investigators(user_id);
CREATE INDEX IF NOT EXISTS idx_investigators_status
  ON public.investigators(user_id, status);
CREATE INDEX IF NOT EXISTS idx_investigator_sessions_investigator
  ON public.investigator_sessions(investigator_id);
CREATE INDEX IF NOT EXISTS idx_investigator_sessions_report
  ON public.investigator_sessions(play_report_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_investigators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS investigators_updated_at ON public.investigators;
CREATE TRIGGER investigators_updated_at
  BEFORE UPDATE ON public.investigators
  FOR EACH ROW EXECUTE FUNCTION update_investigators_updated_at();

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.investigators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigator_sessions ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除してから再作成（冪等実行のため）
DROP POLICY IF EXISTS "investigators_select_own"    ON public.investigators;
DROP POLICY IF EXISTS "investigators_select_public" ON public.investigators;
DROP POLICY IF EXISTS "investigators_insert_own"    ON public.investigators;
DROP POLICY IF EXISTS "investigators_update_own"    ON public.investigators;
DROP POLICY IF EXISTS "investigators_delete_own"    ON public.investigators;
DROP POLICY IF EXISTS "inv_sessions_select"         ON public.investigator_sessions;
DROP POLICY IF EXISTS "inv_sessions_insert"         ON public.investigator_sessions;
DROP POLICY IF EXISTS "inv_sessions_update"         ON public.investigator_sessions;
DROP POLICY IF EXISTS "inv_sessions_delete"         ON public.investigator_sessions;

-- investigators: 全員閲覧可、操作は本人のみ
CREATE POLICY "investigators_select_public" ON public.investigators
  FOR SELECT USING (true);

CREATE POLICY "investigators_insert_own" ON public.investigators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investigators_update_own" ON public.investigators
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investigators_delete_own" ON public.investigators
  FOR DELETE USING (auth.uid() = user_id);

-- investigator_sessions: 探索者オーナーのみ操作、閲覧は全員
CREATE POLICY "inv_sessions_select" ON public.investigator_sessions
  FOR SELECT USING (true);

CREATE POLICY "inv_sessions_insert" ON public.investigator_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.investigators WHERE id = investigator_id AND user_id = auth.uid())
  );

CREATE POLICY "inv_sessions_update" ON public.investigator_sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.investigators WHERE id = investigator_id AND user_id = auth.uid())
  );

CREATE POLICY "inv_sessions_delete" ON public.investigator_sessions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.investigators WHERE id = investigator_id AND user_id = auth.uid())
  );
