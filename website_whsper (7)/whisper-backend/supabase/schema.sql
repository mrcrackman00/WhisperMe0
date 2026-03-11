-- WhisperMe Supabase schema
-- Run in Supabase Dashboard → SQL Editor

-- Profiles: one per auth user (id = auth.users.id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- RLS: users can read/update own profile
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Service role can do anything (backend uses service role)
-- No policy needed for service role; it bypasses RLS.

-- Waitlist: pre-launch signups
create table if not exists public.waitlist (
  id bigserial primary key,
  name text,
  email text not null unique,
  mood text,
  created_at timestamptz not null default now()
);

create index if not exists idx_waitlist_email on public.waitlist(email);
create index if not exists idx_waitlist_created_at on public.waitlist(created_at desc);

alter table public.waitlist enable row level security;

-- Only backend (service role) inserts; no anon insert for waitlist if you want to force API use.
-- If you want Supabase client to insert from frontend:
-- create policy "Allow anon insert waitlist" on public.waitlist for insert with check (true);
-- For API-only insert, leave no insert policy for anon/authenticated so only service role can insert.

-- Events: analytics
create table if not exists public.events (
  id bigserial primary key,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_event_type on public.events(event_type);
create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_created_at on public.events(created_at desc);

alter table public.events enable row level security;

-- Only backend writes events; no public insert policy.
-- Service role can insert/select.

-- Optional: trigger to create profile on signup (Supabase Auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, mood)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), null);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
