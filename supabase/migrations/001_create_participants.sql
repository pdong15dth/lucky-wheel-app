-- ============================================
-- Lucky Wheel Database Migration
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- 1. Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'winner', 'eliminated')),
  prize_rank INTEGER CHECK (prize_rank IS NULL OR prize_rank IN (1, 2, 3)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Realtime (allows real-time subscriptions)
ALTER TABLE participants REPLICA IDENTITY FULL;

-- 3. Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (allow all operations for this demo)
-- Note: In production, you should implement proper authentication

-- Allow anyone to insert (for check-in)
CREATE POLICY "Allow public insert" ON participants 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read (for displaying on wheel)
CREATE POLICY "Allow public read" ON participants 
  FOR SELECT 
  USING (true);

-- Allow anyone to update (for admin to set winners)
CREATE POLICY "Allow public update" ON participants 
  FOR UPDATE 
  USING (true);

-- Allow anyone to delete (for admin to clear participants)
CREATE POLICY "Allow public delete" ON participants 
  FOR DELETE 
  USING (true);

-- ============================================
-- After running this SQL:
-- 1. Go to Database > Replication in Supabase
-- 2. Enable the participants table for replication
-- 3. Make sure INSERT, UPDATE, DELETE events are enabled
-- ============================================
