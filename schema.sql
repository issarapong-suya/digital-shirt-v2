-- =====================================================
-- Supabase SQL Schema for Lampang Digital Shirt System
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- =====================================================

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cid VARCHAR(13) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    agency VARCHAR(100) NOT NULL,
    cut VARCHAR(10) NOT NULL DEFAULT 'ชาย',
    size VARCHAR(20) NOT NULL,
    custom_chest NUMERIC NULL,
    qty INT DEFAULT 1,
    total_price NUMERIC NOT NULL,
    slip_url TEXT NULL,
    payment_status VARCHAR(50) DEFAULT 'ชำระเงินเรียบร้อย',
    round_no INT DEFAULT 2
);

-- 2. Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_orders_cid ON orders(cid);
CREATE INDEX IF NOT EXISTS idx_orders_round ON orders(round_no);

-- 3. Row Level Security Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON orders;
DROP POLICY IF EXISTS "Allow public update orders" ON orders;

CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE USING (true);

-- 4. Create Public Bucket for Slips Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('slips', 'slips', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Slips" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Slips" ON storage.objects;

CREATE POLICY "Public Read Slips" ON storage.objects FOR SELECT USING (bucket_id = 'slips');
CREATE POLICY "Public Upload Slips" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'slips');
