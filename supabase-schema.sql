-- Run this completely in your Supabase SQL Editor.
-- This sets up the exact table structure needed by your Lineage family tree app.

create table public.family_members (
  id text primary key,
  first_name text not null,
  last_name text,
  gender text,
  birth_date text,
  birth_place text,
  is_deceased boolean default false,
  death_date text,
  death_place text,
  occupation text,
  notes text,
  avatar_color text,
  avatar_url text,
  email text,
  phone text,
  secondary_phone text,
  address text,
  aliases text,
  ai_context text,
  father_id text,
  mother_id text,
  spouse_id text
);

-- Enable Realtime Broadcasts on this table so the Front-end 
-- instantly updates when AI Agents (Hermes/OpenCLAW) write to it!
alter publication supabase_realtime add table public.family_members;

-- (Optional) Enable Row Level Security (RLS) policies 
-- Uncomment below if you want to restrict public access.
-- alter table public.family_members enable row level security;
-- create policy "Allow public access" on public.family_members for all using (true);
