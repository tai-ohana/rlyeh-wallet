-- 021: Scenario Stats View
-- play_reports を scenario_name 単位で集計するビュー
-- 公開レポートのみを対象とする

-- ─── scenario_stats ビュー ────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.scenario_stats AS
SELECT
  pr.scenario_name,
  MAX(pr.scenario_author) AS scenario_author,

  -- セッション数（公開レポート）
  COUNT(pr.id)                                                    AS total_sessions,

  -- ユニーク記録者数
  COUNT(DISTINCT pr.user_id)                                      AS unique_reporters,

  -- 平均プレイ時間（分）
  ROUND(AVG(pr.play_duration)::numeric, 1)                       AS avg_duration,

  -- 総プレイ時間（分）
  COALESCE(SUM(pr.play_duration), 0)                             AS total_duration,

  -- クリア率（result = 'success' の割合）
  ROUND(
    (COUNT(CASE WHEN pr.result = 'success' THEN 1 END)::numeric
     / NULLIF(COUNT(pr.id), 0)) * 100,
    1
  )                                                               AS success_rate,

  -- 最初・最後にプレイされた日付
  MIN(pr.play_date_start)                                         AS first_played_at,
  MAX(pr.play_date_start)                                         AS last_played_at,

  -- 最新の cover_image_url（イメージ検索用）
  (
    SELECT cover_image_url FROM public.play_reports
    WHERE scenario_name = pr.scenario_name
      AND privacy_setting = 'public'
      AND cover_image_url IS NOT NULL
    ORDER BY play_date_start DESC
    LIMIT 1
  )                                                               AS cover_image_url

FROM public.play_reports pr
WHERE pr.privacy_setting = 'public'
  AND pr.scenario_name IS NOT NULL
  AND pr.scenario_name != ''
GROUP BY pr.scenario_name;

-- ─── RLS は VIEW なので不要、元テーブルの RLS が適用される ──────────────────

-- ─── KP 別集計ビュー（シナリオ詳細で使用） ──────────────────────────────────
CREATE OR REPLACE VIEW public.scenario_kp_stats AS
SELECT
  pr.scenario_name,
  p.username,
  p.display_name,
  p.avatar_url,
  COUNT(*)                              AS run_count,
  MAX(pr.play_date_start)               AS last_run_at
FROM public.play_reports pr
JOIN public.play_report_participants pp
  ON pp.play_report_id = pr.id AND pp.role = 'KP'
LEFT JOIN public.profiles p ON p.id = pp.user_id
WHERE pr.privacy_setting = 'public'
  AND pr.scenario_name IS NOT NULL
  AND pr.scenario_name != ''
GROUP BY pr.scenario_name, p.username, p.display_name, p.avatar_url;

-- ─── インデックス（scenario_name は既存列、クエリ高速化） ────────────────────
CREATE INDEX IF NOT EXISTS idx_play_reports_scenario_name
  ON public.play_reports (scenario_name)
  WHERE privacy_setting = 'public';
