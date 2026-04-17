create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  song_id text,
  song_title text,
  difficulty text,
  hand_mode text,
  accuracy integer not null default 0 check (accuracy >= 0 and accuracy <= 100),
  score integer not null default 0 check (score >= 0),
  combo integer not null default 0 check (combo >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed boolean not null default false,
  practiced_on date not null default (timezone('America/Sao_Paulo', now())::date),
  created_at timestamptz not null default now()
);

create index if not exists practice_sessions_user_created_at_idx
  on public.practice_sessions (user_id, created_at desc);

create index if not exists practice_sessions_user_practiced_on_idx
  on public.practice_sessions (user_id, practiced_on desc);

alter table public.practice_sessions enable row level security;

drop policy if exists "practice sessions select own" on public.practice_sessions;
create policy "practice sessions select own"
  on public.practice_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "practice sessions insert own" on public.practice_sessions;
create policy "practice sessions insert own"
  on public.practice_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "practice sessions update own" on public.practice_sessions;
create policy "practice sessions update own"
  on public.practice_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "practice sessions delete own" on public.practice_sessions;
create policy "practice sessions delete own"
  on public.practice_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);
