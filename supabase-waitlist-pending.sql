create table if not exists waitlist_pending (
  email text primary key,
  name text,
  mood text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_pending_expires_at_idx
  on waitlist_pending (expires_at);
