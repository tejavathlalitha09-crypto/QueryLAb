-- QueryLab application schema
-- Run in Supabase SQL editor or via `supabase db push`

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Saved queries
create table if not exists public.saved_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  sql_text not null,
  dialect text not null default 'PostgreSQL',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_queries_user_id_idx on public.saved_queries(user_id);
create index if not exists saved_queries_is_favorite_idx on public.saved_queries(user_id, is_favorite);

-- Query history
create table if not exists public.query_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query_text not null,
  status text not null check (status in ('success', 'error')),
  "executionTimeMs" integer not null default 0,
  rows_returned integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists query_history_user_id_created_idx on public.query_history(user_id, created_at desc);

-- Workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workspaces_user_id_idx on public.workspaces(user_id);

-- Workspace queries
create table if not exists public.workspace_queries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  sql_text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workspace_queries_workspace_id_idx on public.workspace_queries(workspace_id);

-- updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
drop trigger if exists saved_queries_updated_at on public.saved_queries;
create trigger saved_queries_updated_at before update on public.saved_queries for each row execute function public.handle_updated_at();
drop trigger if exists workspaces_updated_at on public.workspaces;
create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.handle_updated_at();
drop trigger if exists workspace_queries_updated_at on public.workspace_queries;
create trigger workspace_queries_updated_at before update on public.workspace_queries for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.saved_queries enable row level security;
alter table public.query_history enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_queries enable row level security;

-- Profiles: users can read/update their own
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Saved queries: full CRUD for owner only
drop policy if exists "saved_queries_owner_all" on public.saved_queries;
create policy "saved_queries_owner_all" on public.saved_queries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Query history: full CRUD for owner only
drop policy if exists "query_history_owner_all" on public.query_history;
create policy "query_history_owner_all" on public.query_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Workspaces: full CRUD for owner only
drop policy if exists "workspaces_owner_all" on public.workspaces;
create policy "workspaces_owner_all" on public.workspaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Workspace queries: access via workspace ownership
drop policy if exists "workspace_queries_owner_all" on public.workspace_queries;
create policy "workspace_queries_owner_all" on public.workspace_queries
  for all using (
    exists (select 1 from public.workspaces w where w.id = workspace_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workspaces w where w.id = workspace_id and w.user_id = auth.uid())
  );
