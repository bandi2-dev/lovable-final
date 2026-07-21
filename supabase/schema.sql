-- ResuMate — Supabase schema (final)
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → Run.
-- The app talks to Supabase from the browser using the anon (publishable) key.
-- Authentication is handled locally (Web Crypto in localStorage) for this
-- academic demo, so RLS policies are permissive and scoped by user_email.
-- To harden for production, migrate the local auth to Supabase Auth and swap
-- the policies to `auth.uid() = user_id`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- analyses — one row per resume analysis
-- ---------------------------------------------------------------------------
create table if not exists public.analyses (
  id                  uuid primary key default gen_random_uuid(),
  user_email          text        not null,
  file_name           text        not null,
  ats_score           integer     not null check (ats_score between 0 and 100),
  jd_overlap          integer              check (jd_overlap between 0 and 100),
  summary             text,
  matched_keywords    jsonb       not null default '[]'::jsonb,
  missing_keywords    jsonb       not null default '[]'::jsonb,
  ats_breakdown       jsonb       not null default '{}'::jsonb,
  ai_suggestions      jsonb,
  resume_excerpt      text,
  jd_excerpt          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists analyses_user_email_created_at_idx
  on public.analyses (user_email, created_at desc);
create index if not exists analyses_created_at_idx
  on public.analyses (created_at desc);

drop trigger if exists analyses_set_updated_at on public.analyses;
create trigger analyses_set_updated_at
  before update on public.analyses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscribers — newsletter / waitlist
-- ---------------------------------------------------------------------------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text        not null,
  source     text,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so "Foo@x.com" and "foo@x.com" don't duplicate.
create unique index if not exists subscribers_email_lower_idx
  on public.subscribers (lower(email));

-- ---------------------------------------------------------------------------
-- cover_letters — history of AI-generated cover letters
-- ---------------------------------------------------------------------------
create table if not exists public.cover_letters (
  id         uuid primary key default gen_random_uuid(),
  user_email text        not null,
  job_title  text,
  company    text,
  tone       text        not null default 'professional',
  content    text        not null,
  created_at timestamptz not null default now()
);

create index if not exists cover_letters_user_email_created_at_idx
  on public.cover_letters (user_email, created_at desc);

-- ---------------------------------------------------------------------------
-- Grants (PostgREST / Data API)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.analyses      to anon, authenticated;
grant select, insert                  on public.subscribers  to anon, authenticated;
grant select, insert, delete          on public.cover_letters to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Demo policies: anon key + user_email column. Swap to auth.uid() when you
-- migrate to Supabase Auth.
-- ---------------------------------------------------------------------------
alter table public.analyses      enable row level security;
alter table public.subscribers   enable row level security;
alter table public.cover_letters enable row level security;

-- analyses
drop policy if exists "analyses_read"   on public.analyses;
drop policy if exists "analyses_insert" on public.analyses;
drop policy if exists "analyses_update" on public.analyses;
drop policy if exists "analyses_delete" on public.analyses;

create policy "analyses_read"   on public.analyses for select
  to anon, authenticated using (true);
create policy "analyses_insert" on public.analyses for insert
  to anon, authenticated with check (user_email is not null);
create policy "analyses_update" on public.analyses for update
  to anon, authenticated using (true) with check (true);
create policy "analyses_delete" on public.analyses for delete
  to anon, authenticated using (true);

-- subscribers
drop policy if exists "subs_insert" on public.subscribers;
create policy "subs_insert" on public.subscribers for insert
  to anon, authenticated with check (email is not null);

-- cover_letters
drop policy if exists "cl_read"   on public.cover_letters;
drop policy if exists "cl_insert" on public.cover_letters;
drop policy if exists "cl_delete" on public.cover_letters;

create policy "cl_read"   on public.cover_letters for select
  to anon, authenticated using (true);
create policy "cl_insert" on public.cover_letters for insert
  to anon, authenticated with check (user_email is not null);
create policy "cl_delete" on public.cover_letters for delete
  to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Convenience view: per-user stats (used by the profile page if you wire it up)
-- ---------------------------------------------------------------------------
create or replace view public.analyses_user_stats as
select
  user_email,
  count(*)                              as total,
  round(avg(ats_score))::int            as avg_ats,
  max(ats_score)                        as best_ats,
  max(created_at)                       as last_analyzed_at
from public.analyses
group by user_email;

grant select on public.analyses_user_stats to anon, authenticated;
