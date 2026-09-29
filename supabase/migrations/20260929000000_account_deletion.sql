-- Account deletion (App Store 5.1.1(v), Google Play and LGPD art. 18).
--
-- 1. A student's deletion must not erase the commission their teacher earned: the
--    entry keeps the amount and invoice, only the link to the student is cleared.
-- 2. account_deletion_requests records each deletion: completed ones keep no personal
--    data beyond the old user id; teachers' requests keep the e-mail so support can
--    settle commissions and withdrawals (fiscal records) before closing the account.

begin;

alter table public.teacher_commission_entries
  alter column student_id drop not null;

alter table public.teacher_commission_entries
  drop constraint if exists teacher_commission_entries_student_id_fkey;

alter table public.teacher_commission_entries
  add constraint teacher_commission_entries_student_id_fkey
  foreign key (student_id) references public.profiles (id) on delete set null;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null,
  status text not null check (status in ('requested', 'completed')),
  contact_email text,
  had_subscription boolean not null default false,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists account_deletion_requests_open_idx
  on public.account_deletion_requests (user_id)
  where status = 'requested';

alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public, anon, authenticated;
grant all on public.account_deletion_requests to service_role;

commit;
