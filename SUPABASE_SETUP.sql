-- Run ALL of this in Supabase SQL Editor
-- Project: BillGuard AI

-- Step 1: Enable UUID extension
create extension if not exists "pgcrypto";

-- Step 2: Create users table
drop table if exists users;
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  plan text default 'free',
  audits_used integer default 0,
  audits_limit integer default 5,
  expiry timestamp,
  created_at timestamp default now()
);

-- Step 3: Create audits table
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  carrier_name TEXT NOT NULL,
  match_status TEXT CHECK (match_status IN ('MATCH', 'DISCREPANCY')) NOT NULL,
  match_score INTEGER NOT NULL,
  potential_refund NUMERIC(12, 2) NOT NULL,
  base_currency TEXT NOT NULL,
  loading_port TEXT NOT NULL,
  discharge_port TEXT NOT NULL,
  line_items JSONB NOT NULL,
  details JSONB NOT NULL
);

-- Step 4: Enable Row Level Security on audits
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies
CREATE POLICY "Users can view their own audits"
ON public.audits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audits"
ON public.audits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Step 6: Disable RLS on users table (admin access needed)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
