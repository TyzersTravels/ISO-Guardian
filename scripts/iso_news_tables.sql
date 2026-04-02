-- ============================================================
-- ISO News & Updates System — Database Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. News Sources — RSS feed registry
CREATE TABLE IF NOT EXISTS news_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  source_type text NOT NULL DEFAULT 'rss'
    CHECK (source_type IN ('rss', 'html_scrape', 'api')),
  standards text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_fetched_at timestamptz,
  fetch_interval_hours integer DEFAULT 24,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_news_sources" ON news_sources
  FOR ALL USING (public.is_super_admin());

-- 2. ISO News Articles — Processed articles with AI summaries
CREATE TABLE IF NOT EXISTS iso_news_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid REFERENCES news_sources(id) ON DELETE SET NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  ai_insight text,
  standards text[] NOT NULL DEFAULT '{}',
  categories text[] DEFAULT '{}',
  image_url text,
  published_at timestamptz,
  fetched_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'rejected')),
  slug text UNIQUE,
  relevance_score integer DEFAULT 50
    CHECK (relevance_score >= 0 AND relevance_score <= 100),
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_source_url ON iso_news_articles(source_url);
CREATE INDEX IF NOT EXISTS idx_news_articles_standards ON iso_news_articles USING GIN (standards);
CREATE INDEX IF NOT EXISTS idx_news_articles_status_published ON iso_news_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON iso_news_articles(status);

ALTER TABLE iso_news_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles (anon + authenticated)
CREATE POLICY "public_read_published_articles" ON iso_news_articles
  FOR SELECT USING (status = 'published');

-- Super admin full access for moderation
CREATE POLICY "super_admin_news_articles" ON iso_news_articles
  FOR ALL USING (public.is_super_admin());

-- Service role bypass (for Edge Function inserts)
CREATE POLICY "service_role_news_articles" ON iso_news_articles
  FOR ALL USING (auth.role() = 'service_role');

-- 3. News Fetch Logs — Operational logging
CREATE TABLE IF NOT EXISTS news_fetch_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid REFERENCES news_sources(id) ON DELETE SET NULL,
  source_name text,
  status text NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'partial', 'error')),
  articles_found integer DEFAULT 0,
  articles_new integer DEFAULT 0,
  articles_skipped integer DEFAULT 0,
  error_message text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news_fetch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_news_fetch_logs" ON news_fetch_logs
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "service_role_news_fetch_logs" ON news_fetch_logs
  FOR ALL USING (auth.role() = 'service_role');

-- 4. News Subscribers — Email capture for ISO news digest
CREATE TABLE IF NOT EXISTS news_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  standards text[] NOT NULL DEFAULT '{ISO 9001}',
  is_active boolean DEFAULT true,
  unsubscribe_token uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news_subscribers ENABLE ROW LEVEL SECURITY;

-- Anon can subscribe (INSERT only)
CREATE POLICY "anon_subscribe" ON news_subscribers
  FOR INSERT WITH CHECK (true);

-- Super admin full access
CREATE POLICY "super_admin_news_subscribers" ON news_subscribers
  FOR ALL USING (public.is_super_admin());

-- Service role for digest emails
CREATE POLICY "service_role_news_subscribers" ON news_subscribers
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Seed initial news sources
-- ============================================================
INSERT INTO news_sources (name, url, source_type, standards) VALUES
  ('Advisera ISO 9001 Blog', 'https://advisera.com/9001academy/blog/feed/', 'rss', ARRAY['ISO 9001']),
  ('Advisera ISO 14001 Blog', 'https://advisera.com/14001academy/blog/feed/', 'rss', ARRAY['ISO 14001']),
  ('Advisera ISO 45001 Blog', 'https://advisera.com/45001academy/blog/feed/', 'rss', ARRAY['ISO 45001'])
ON CONFLICT (url) DO NOTHING;

-- Deactivate dead sources (404)
UPDATE news_sources SET is_active = false WHERE url IN (
  'https://www.iso.org/cms/render/live/en/sites/isoorg/home/news.html',
  'https://www.qualitymag.com/rss/topic/2642-iso'
);
