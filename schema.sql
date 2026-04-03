-- ============================================
-- Run this ONCE in Supabase → SQL Editor → New Query → Run
-- ============================================

CREATE TABLE problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  country TEXT DEFAULT 'Unknown',
  votes INTEGER DEFAULT 1,
  needs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_problems_lat ON problems (lat);
CREATE INDEX idx_problems_lng ON problems (lng);
CREATE INDEX idx_problems_votes ON problems (votes DESC);

-- Allow anyone to read, insert, and update (anonymous app)
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read" ON problems FOR SELECT USING (true);
CREATE POLICY "insert" ON problems FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON problems FOR UPDATE USING (true) WITH CHECK (true);
