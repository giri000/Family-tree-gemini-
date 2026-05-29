-- Run this completely in your Supabase SQL Editor.
-- This sets up the exact table structure needed by your Lineage family tree app.

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  first_name text not null,
  last_name text,
  gender text,
  birth_date text,
  birth_place text,
  is_deceased boolean default false,
  death_date text,
  death_place text,
  occupation text,
  blood_group text,
  notes text,
  avatar_color text,
  avatar_url text,
  email text,
  phone text,
  secondary_phone text,
  address text,
  aliases text,
  ai_context text,
  father_id uuid references public.family_members(id) on delete set null,
  mother_id uuid references public.family_members(id) on delete set null,
  spouse_id uuid references public.family_members(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Optimize our most frequent queries by adding appropriate database indexes
create index idx_family_members_user_id on public.family_members(user_id);
create index idx_family_members_father_id on public.family_members(father_id);
create index idx_family_members_mother_id on public.family_members(mother_id);
create index idx_family_members_spouse_id on public.family_members(spouse_id);
create index idx_family_members_email on public.family_members(email);

-- Enable Realtime Broadcasts on this table so the Front-end 
-- instantly updates when AI Agents (Hermes/OpenCLAW) write to it!
alter publication supabase_realtime add table public.family_members;

-- Enable Row Level Security (RLS) explicitly
alter table public.family_members enable row level security;

-- Create Policies to ensure users cannot read or write to each other's data
create policy "Users can view their own family members"
  on public.family_members for select
  using (auth.uid() = user_id);

create policy "Users can insert their own family members"
  on public.family_members for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own family members"
  on public.family_members for update
  using (auth.uid() = user_id);

create policy "Users can delete their own family members"
  on public.family_members for delete
  using (auth.uid() = user_id);
