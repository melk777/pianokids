-- Analytics interno do funil Pianify.
-- Rode este SQL no Supabase para persistir os eventos enviados para /api/analytics/event.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null,
  user_id uuid null references auth.users(id) on delete set null,
  anonymous_id text null,
  path text null,
  referrer text null,
  properties jsonb not null default '{}'::jsonb,
  user_agent text null,
  ip_hash_source text null
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_created_at_idx
  on public.analytics_events (event, created_at desc);

create index if not exists analytics_events_user_id_created_at_idx
  on public.analytics_events (user_id, created_at desc);

create index if not exists analytics_events_anonymous_id_created_at_idx
  on public.analytics_events (anonymous_id, created_at desc);

alter table public.analytics_events enable row level security;

-- Nao exponha eventos no cliente. A API usa service role no servidor.
drop policy if exists "analytics_events_no_client_select" on public.analytics_events;
drop policy if exists "analytics_events_no_client_insert" on public.analytics_events;

create policy "analytics_events_no_client_select"
  on public.analytics_events
  for select
  using (false);

create policy "analytics_events_no_client_insert"
  on public.analytics_events
  for insert
  with check (false);
