-- Facebook Tokens Table for storing Page Access Tokens
-- This allows for seamless token management without user intervention

create table if not exists facebook_tokens (
  id uuid primary key default gen_random_uuid(),
  page_id text not null unique,
  page_name text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  last_refreshed timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for quick lookups
create index if not exists facebook_tokens_page_id_idx on facebook_tokens(page_id);
create index if not exists facebook_tokens_active_idx on facebook_tokens(is_active) where is_active = true;

-- Function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_facebook_tokens_updated_at
  before update on facebook_tokens
  for each row
  execute function update_updated_at_column();

-- Insert a default record for FunFreq (you can update this later via the UI)
insert into facebook_tokens (page_id, page_name, access_token, is_active)
values ('604489102757371', 'FunFreq', '', false)
on conflict (page_id) do nothing; 