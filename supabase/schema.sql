-- 100 kun: bulutli sinxronlash uchun jadval (Supabase → SQL Editor)
create table if not exists sync_data (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table sync_data enable row level security;
create policy "own row" on sync_data for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
