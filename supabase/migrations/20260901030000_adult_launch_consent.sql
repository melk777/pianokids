-- Launch policy: self-service registration is adult-only until a verifiable
-- guardian-consent flow is available. This is a product safety control and is
-- not a substitute for legal review of the final policies.

alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists partner_terms_version text;
alter table public.profiles add column if not exists partner_terms_accepted_at timestamptz;

update public.profiles
set cpf = nullif(regexp_replace(cpf, '[^0-9]', '', 'g'), '')
where cpf is not null;

create unique index if not exists profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null;

create or replace function public.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  total integer := 0;
  expected_digit integer;
  index_position integer;
begin
  if length(digits) <> 11
    or digits = repeat(substring(digits from 1 for 1), 11) then
    return false;
  end if;

  for index_position in 1..9 loop
    total := total + substring(digits from index_position for 1)::integer * (11 - index_position);
  end loop;
  expected_digit := (total * 10) % 11;
  if expected_digit = 10 then expected_digit := 0; end if;
  if expected_digit <> substring(digits from 10 for 1)::integer then return false; end if;

  total := 0;
  for index_position in 1..10 loop
    total := total + substring(digits from index_position for 1)::integer * (12 - index_position);
  end loop;
  expected_digit := (total * 10) % 11;
  if expected_digit = 10 then expected_digit := 0; end if;

  return expected_digit = substring(digits from 11 for 1)::integer;
end;
$$;

revoke execute on function public.is_valid_cpf(text) from public, anon, authenticated;

revoke insert on public.profiles from authenticated;
drop policy if exists profiles_insert_own on public.profiles;

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
  normalized_cpf text;
  normalized_phone text;
  normalized_full_name text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher'
    else 'student'
  end;

  normalized_full_name := regexp_replace(
    trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')),
    '[[:space:]]+',
    ' ',
    'g'
  );
  if char_length(normalized_full_name) not between 2 and 120 then
    raise exception 'full name is required' using errcode = '23514';
  end if;

  if new.raw_user_meta_data ->> 'terms_accepted' is distinct from 'true'
    or new.raw_user_meta_data ->> 'terms_version' is distinct from '2026-09-01' then
    raise exception 'platform terms must be accepted' using errcode = '23514';
  end if;

  begin
    resolved_birth_date := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
  exception when others then
    raise exception 'invalid birth date' using errcode = '22007';
  end;

  if resolved_birth_date is null
    or resolved_birth_date > current_date - interval '18 years'
    or resolved_birth_date < current_date - interval '120 years' then
    raise exception 'self-service registration is currently adult-only' using errcode = '23514';
  end if;

  if requested_role = 'teacher' then
    normalized_cpf := regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf', ''), '[^0-9]', '', 'g');
    normalized_phone := regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9]', '', 'g');

    if not public.is_valid_cpf(normalized_cpf)
      or length(normalized_phone) not in (10, 11)
      or length(trim(coalesce(new.raw_user_meta_data ->> 'pix_key', ''))) not between 1 and 150
      or new.raw_user_meta_data ->> 'partner_terms_version' is distinct from '2026-09-01' then
      raise exception 'invalid teacher registration data' using errcode = '23514';
    end if;
  end if;

  base_username := regexp_replace(
    split_part(coalesce(new.email, 'aluno'), '@', 1),
    '[^a-zA-Z0-9_]',
    '',
    'g'
  );
  if base_username = '' then base_username := 'aluno'; end if;

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
    referred_by,
    terms_version,
    terms_accepted_at,
    partner_terms_version,
    partner_terms_accepted_at
  ) values (
    new.id,
    left(base_username, 24) || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    normalized_full_name,
    requested_role,
    case when requested_role = 'student' then 'trialing' else null end,
    case when requested_role = 'student' then now() + interval '7 days' else null end,
    resolved_birth_date,
    null,
    case when requested_role = 'teacher' then normalized_cpf else null end,
    case when requested_role = 'teacher' then normalized_phone else null end,
    case when requested_role = 'teacher' then trim(new.raw_user_meta_data ->> 'pix_key') else null end,
    case when requested_role = 'teacher' then 'PIF-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)) else null end,
    case when requested_role = 'student' then resolved_referrer else null end,
    '2026-09-01',
    now(),
    case when requested_role = 'teacher' then '2026-09-01' else null end,
    case when requested_role = 'teacher' then now() else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.protect_profile_consent_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() and (
    new.terms_version is distinct from old.terms_version
    or new.terms_accepted_at is distinct from old.terms_accepted_at
    or new.partner_terms_version is distinct from old.partner_terms_version
    or new.partner_terms_accepted_at is distinct from old.partner_terms_accepted_at
  ) then
    raise exception 'consent fields can only be changed by the server' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_consent_fields on public.profiles;
create trigger profiles_protect_consent_fields
before update on public.profiles
for each row execute function public.protect_profile_consent_fields();
