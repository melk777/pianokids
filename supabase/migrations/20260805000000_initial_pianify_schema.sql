-- Reproducible base schema for Pianify.
-- Review and test this migration in a staging Supabase project before production.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  username_changes_count integer not null default 0,
  full_name text,
  avatar_url text,
  trophies integer not null default 1,
  streak_days integer not null default 0,
  total_practice_time bigint not null default 0,
  average_accuracy numeric(5, 2) not null default 0,
  songs_played integer not null default 0,
  songs_completed integer not null default 0,
  last_practice_date date,
  role text not null default 'student',
  subscription_status text,
  subscription_plan_interval text,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  birth_date date,
  guardian_email text,
  cpf text,
  phone text,
  pix_key text,
  referral_code text,
  referred_by uuid references public.profiles (id) on delete set null,
  balance_withdrawn_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('student', 'teacher', 'admin')),
  constraint profiles_username_changes_check check (username_changes_count between 0 and 1),
  constraint profiles_nonnegative_stats_check check (
    trophies >= 0 and streak_days >= 0 and total_practice_time >= 0 and
    average_accuracy between 0 and 100 and songs_played >= 0 and
    songs_completed >= 0 and balance_withdrawn_total >= 0
  )
);

-- Bring older manually-created profile tables up to the versioned shape.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists username_changes_count integer not null default 0;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists trophies integer not null default 1;
alter table public.profiles add column if not exists streak_days integer not null default 0;
alter table public.profiles add column if not exists total_practice_time bigint not null default 0;
alter table public.profiles add column if not exists average_accuracy numeric(5, 2) not null default 0;
alter table public.profiles add column if not exists songs_played integer not null default 0;
alter table public.profiles add column if not exists songs_completed integer not null default 0;
alter table public.profiles add column if not exists last_practice_date date;
alter table public.profiles add column if not exists role text not null default 'student';
alter table public.profiles add column if not exists subscription_status text;
alter table public.profiles add column if not exists subscription_plan_interval text;
alter table public.profiles add column if not exists trial_ends_at timestamptz;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists guardian_email text;
alter table public.profiles add column if not exists cpf text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists pix_key text;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles (id) on delete set null;
alter table public.profiles add column if not exists balance_withdrawn_total numeric(12, 2) not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username)) where username is not null;
create unique index if not exists profiles_referral_code_unique
  on public.profiles (upper(referral_code)) where referral_code is not null;
create unique index if not exists profiles_stripe_customer_unique
  on public.profiles (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists profiles_stripe_subscription_unique
  on public.profiles (stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  song_id text,
  song_title text,
  difficulty text,
  hand_mode text,
  accuracy integer not null default 0 check (accuracy between 0 and 100),
  score bigint not null default 0 check (score >= 0),
  combo integer not null default 0 check (combo >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed boolean not null default false,
  practiced_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists practice_sessions_user_created_idx
  on public.practice_sessions (user_id, created_at desc);
create index if not exists practice_sessions_user_date_idx
  on public.practice_sessions (user_id, practiced_on desc);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_distinct_users_check check (sender_id <> receiver_id)
);
create unique index if not exists friendships_unique_pair
  on public.friendships (least(sender_id, receiver_id), greatest(sender_id, receiver_id));
create index if not exists friendships_sender_idx on public.friendships (sender_id);
create index if not exists friendships_receiver_idx on public.friendships (receiver_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint messages_distinct_users_check check (sender_id <> receiver_id)
);
create index if not exists messages_conversation_idx
  on public.messages (sender_id, receiver_id, created_at);

create table if not exists public.song_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  recommendation text not null check (char_length(recommendation) between 1 and 500),
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'concluido', 'rejeitado')),
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.withdrawals add column if not exists receipt_path text;
create index if not exists withdrawals_teacher_created_idx
  on public.withdrawals (teacher_id, created_at desc);

create table if not exists public.company_expenses (
  id uuid primary key default gen_random_uuid(),
  month_year text not null unique check (month_year ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  marketing numeric(12, 2) not null default 0 check (marketing >= 0),
  development numeric(12, 2) not null default 0 check (development >= 0),
  copyrights numeric(12, 2) not null default 0 check (copyrights >= 0),
  other numeric(12, 2) not null default 0 check (other >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  user_id uuid references public.profiles (id) on delete set null,
  anonymous_id text,
  path text,
  referrer text,
  properties jsonb not null default '{}'::jsonb,
  user_agent text,
  ip_hash_source text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_created_idx on public.analytics_events (event, created_at desc);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.are_friends(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and least(sender_id, receiver_id) = least(first_user, second_user)
      and greatest(sender_id, receiver_id) = greatest(first_user, second_user)
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
revoke execute on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
      or new.subscription_status is distinct from old.subscription_status
      or new.subscription_plan_interval is distinct from old.subscription_plan_interval
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.referral_code is distinct from old.referral_code
      or new.referred_by is distinct from old.referred_by
      or new.balance_withdrawn_total is distinct from old.balance_withdrawn_total
      or new.trophies is distinct from old.trophies
      or new.streak_days is distinct from old.streak_days
      or new.total_practice_time is distinct from old.total_practice_time
      or new.average_accuracy is distinct from old.average_accuracy
      or new.songs_played is distinct from old.songs_played
      or new.songs_completed is distinct from old.songs_completed
      or new.last_practice_date is distinct from old.last_practice_date
      or new.created_at is distinct from old.created_at then
      raise exception 'protected profile fields can only be changed by the server'
        using errcode = '42501';
    end if;

    if new.username is distinct from old.username then
      if old.username_changes_count >= 1 or new.username_changes_count <> old.username_changes_count + 1 then
        raise exception 'username can only be changed once' using errcode = '23514';
      end if;
    elsif new.username_changes_count is distinct from old.username_changes_count then
      raise exception 'username change counter cannot be changed directly' using errcode = '42501';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  base_username text;
  resolved_referrer uuid;
  resolved_birth_date date;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher'
    else 'student'
  end;

  base_username := regexp_replace(
    split_part(coalesce(new.email, 'aluno'), '@', 1),
    '[^a-zA-Z0-9_]',
    '',
    'g'
  );
  if base_username = '' then base_username := 'aluno'; end if;

  begin
    resolved_birth_date := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
  exception when others then
    resolved_birth_date := null;
  end;

  select id into resolved_referrer
  from public.profiles
  where role = 'teacher'
    and upper(referral_code) = upper(new.raw_user_meta_data ->> 'referred_by_code')
  limit 1;

  insert into public.profiles (
    id,
    username,
    full_name,
    role,
    subscription_status,
    trial_ends_at,
    birth_date,
    guardian_email,
    cpf,
    phone,
    pix_key,
    referral_code,
    referred_by
  ) values (
    new.id,
    left(base_username, 24) || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role,
    case when requested_role = 'student' then 'trialing' else null end,
    case when requested_role = 'student' then now() + interval '7 days' else null end,
    resolved_birth_date,
    nullif(new.raw_user_meta_data ->> 'guardian_email', ''),
    case when requested_role = 'teacher' then nullif(new.raw_user_meta_data ->> 'cpf', '') else null end,
    case when requested_role = 'teacher' then nullif(new.raw_user_meta_data ->> 'phone', '') else null end,
    case when requested_role = 'teacher' then nullif(new.raw_user_meta_data ->> 'pix_key', '') else null end,
    case when requested_role = 'teacher' then 'PIF-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)) else null end,
    case when requested_role = 'student' then resolved_referrer else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

drop trigger if exists song_recommendations_set_updated_at on public.song_recommendations;
create trigger song_recommendations_set_updated_at
before update on public.song_recommendations
for each row execute function public.set_updated_at();

drop trigger if exists withdrawals_set_updated_at on public.withdrawals;
create trigger withdrawals_set_updated_at
before update on public.withdrawals
for each row execute function public.set_updated_at();

drop trigger if exists company_expenses_set_updated_at on public.company_expenses;
create trigger company_expenses_set_updated_at
before update on public.company_expenses
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- A deliberately limited social view keeps private profile fields out of search and friendships.
create or replace view public.public_profiles
with (security_barrier = true)
as
select
  id,
  username,
  full_name,
  avatar_url,
  trophies,
  streak_days,
  songs_completed,
  last_practice_date,
  role
from public.profiles
where role in ('student', 'teacher');

revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;
alter table public.song_recommendations enable row level security;
alter table public.withdrawals enable row level security;
alter table public.company_expenses enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (
  id = (select auth.uid())
  and role in ('student', 'teacher')
  and (subscription_status is null or subscription_status = 'trialing')
  and subscription_plan_interval is null
  and stripe_customer_id is null
  and stripe_subscription_id is null
  and balance_withdrawn_total = 0
);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
for update to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

revoke all on public.practice_sessions from anon, authenticated;
grant select, insert on public.practice_sessions to authenticated;
drop policy if exists practice_sessions_select_own on public.practice_sessions;
create policy practice_sessions_select_own on public.practice_sessions
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists practice_sessions_insert_own on public.practice_sessions;
create policy practice_sessions_insert_own on public.practice_sessions
for insert to authenticated with check (user_id = (select auth.uid()));

revoke all on public.friendships from anon, authenticated;
grant select, insert, delete on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;
drop policy if exists friendships_select_participant on public.friendships;
create policy friendships_select_participant on public.friendships
for select to authenticated
using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));
drop policy if exists friendships_insert_sender on public.friendships;
create policy friendships_insert_sender on public.friendships
for insert to authenticated
with check (
  sender_id = (select auth.uid()) and receiver_id <> (select auth.uid()) and status = 'pending'
);
drop policy if exists friendships_update_receiver on public.friendships;
create policy friendships_update_receiver on public.friendships
for update to authenticated
using (receiver_id = (select auth.uid()))
with check (receiver_id = (select auth.uid()) and status in ('accepted', 'blocked'));
drop policy if exists friendships_delete_participant on public.friendships;
create policy friendships_delete_participant on public.friendships
for delete to authenticated
using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));

revoke all on public.messages from anon, authenticated;
grant select, insert on public.messages to authenticated;
grant update (is_read) on public.messages to authenticated;
drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
for select to authenticated
using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));
drop policy if exists messages_insert_between_friends on public.messages;
create policy messages_insert_between_friends on public.messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and receiver_id <> (select auth.uid())
  and public.are_friends(sender_id, receiver_id)
);
drop policy if exists messages_mark_received_read on public.messages;
create policy messages_mark_received_read on public.messages
for update to authenticated
using (receiver_id = (select auth.uid()))
with check (receiver_id = (select auth.uid()));

revoke all on public.song_recommendations from anon, authenticated;
grant select, insert on public.song_recommendations to authenticated;
drop policy if exists recommendations_select_own_or_admin on public.song_recommendations;
create policy recommendations_select_own_or_admin on public.song_recommendations
for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists recommendations_insert_own on public.song_recommendations;
create policy recommendations_insert_own on public.song_recommendations
for insert to authenticated with check (user_id = (select auth.uid()));

revoke all on public.withdrawals from anon, authenticated;
grant select, insert, update on public.withdrawals to authenticated;
drop policy if exists withdrawals_select_teacher_or_admin on public.withdrawals;
create policy withdrawals_select_teacher_or_admin on public.withdrawals
for select to authenticated
using (teacher_id = (select auth.uid()) or public.is_admin());
drop policy if exists withdrawals_insert_teacher on public.withdrawals;
create policy withdrawals_insert_teacher on public.withdrawals
for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and status = 'pendente'
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'teacher'
  )
);
drop policy if exists withdrawals_update_admin on public.withdrawals;
create policy withdrawals_update_admin on public.withdrawals
for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.company_expenses from anon, authenticated;
grant select, insert, update, delete on public.company_expenses to authenticated;
drop policy if exists company_expenses_admin_all on public.company_expenses;
create policy company_expenses_admin_all on public.company_expenses
for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.analytics_events from anon, authenticated;
grant all on public.analytics_events to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
for select to public using (bucket_id = 'avatars');
drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and name like ((select auth.uid())::text || '-%'));
drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and name like ((select auth.uid())::text || '-%'))
with check (bucket_id = 'avatars' and name like ((select auth.uid())::text || '-%'));
drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and name like ((select auth.uid())::text || '-%'));

drop policy if exists receipts_admin_read on storage.objects;
create policy receipts_admin_read on storage.objects
for select to authenticated using (bucket_id = 'receipts' and public.is_admin());
drop policy if exists receipts_admin_insert on storage.objects;
create policy receipts_admin_insert on storage.objects
for insert to authenticated with check (bucket_id = 'receipts' and public.is_admin());
drop policy if exists receipts_admin_update on storage.objects;
create policy receipts_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'receipts' and public.is_admin())
with check (bucket_id = 'receipts' and public.is_admin());
drop policy if exists receipts_admin_delete on storage.objects;
create policy receipts_admin_delete on storage.objects
for delete to authenticated using (bucket_id = 'receipts' and public.is_admin());

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships'
    ) then
      alter publication supabase_realtime add table public.friendships;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
  end if;
end;
$$;

commit;
