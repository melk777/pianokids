-- Commercial launch hardening: Stripe idempotency, invoice-backed commissions,
-- and transactional teacher withdrawals. Apply in staging before production.

begin;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  object_id text,
  livemode boolean not null default false,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  stripe_invoice_id text primary key,
  user_id uuid references public.profiles (id) on delete set null,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  amount_paid bigint not null default 0 check (amount_paid >= 0),
  amount_refunded bigint not null default 0 check (amount_refunded >= 0),
  stripe_fee_amount bigint not null default 0 check (stripe_fee_amount >= 0),
  net_received bigint not null default 0 check (net_received >= 0),
  currency text not null,
  plan_interval text,
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists billing_invoices_user_paid_idx
  on public.billing_invoices (user_id, paid_at desc);
create index if not exists billing_invoices_customer_idx
  on public.billing_invoices (stripe_customer_id, paid_at desc);

create table if not exists public.teacher_commission_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  stripe_invoice_id text references public.billing_invoices (stripe_invoice_id) on delete restrict,
  source_type text not null check (source_type in ('invoice', 'refund', 'dispute', 'adjustment')),
  source_key text not null unique,
  amount numeric(12, 2) not null check (amount <> 0),
  currency text not null default 'brl',
  description text,
  available_at timestamptz not null,
  withdrawal_id uuid references public.withdrawals (id) on delete set null,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists teacher_commissions_balance_idx
  on public.teacher_commission_entries (teacher_id, available_at)
  where withdrawal_id is null and settled_at is null;
create index if not exists teacher_commissions_withdrawal_idx
  on public.teacher_commission_entries (withdrawal_id)
  where withdrawal_id is not null;

alter table public.stripe_webhook_events enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.teacher_commission_entries enable row level security;

revoke all on public.stripe_webhook_events from public, anon, authenticated;
revoke all on public.billing_invoices from public, anon, authenticated;
revoke all on public.teacher_commission_entries from public, anon, authenticated;
grant all on public.stripe_webhook_events to service_role;
grant all on public.billing_invoices to service_role;
grant all on public.teacher_commission_entries to service_role;

-- Teachers may view withdrawals through RLS, but only the transaction function
-- below may create them. This closes the direct REST insert vulnerability.
revoke insert on public.withdrawals from authenticated;
drop policy if exists withdrawals_insert_teacher on public.withdrawals;

create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_object_id text,
  p_livemode boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
  existing_status text;
begin
  insert into public.stripe_webhook_events (
    event_id, event_type, object_id, livemode, status, attempts, updated_at
  ) values (
    p_event_id, p_event_type, p_object_id, p_livemode, 'processing', 1, now()
  )
  on conflict (event_id) do update set
    status = 'processing',
    attempts = public.stripe_webhook_events.attempts + 1,
    last_error = null,
    updated_at = now()
  where public.stripe_webhook_events.status = 'failed'
     or (
       public.stripe_webhook_events.status = 'processing'
       and public.stripe_webhook_events.updated_at < now() - interval '15 minutes'
     );

  get diagnostics affected_rows = row_count;
  if affected_rows = 1 then return true; end if;

  select status into existing_status
  from public.stripe_webhook_events
  where event_id = p_event_id;

  if existing_status = 'processing' then
    raise exception 'webhook event is already processing' using errcode = '55P03';
  end if;

  return false;
end;
$$;

create or replace function public.record_paid_invoice(
  p_invoice_id text,
  p_customer_id text,
  p_subscription_id text,
  p_payment_intent_id text,
  p_amount_paid bigint,
  p_fee_amount bigint,
  p_net_amount bigint,
  p_currency text,
  p_paid_at timestamptz,
  p_plan_interval text,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_student_id uuid;
  resolved_teacher_id uuid;
  commission_amount numeric(12, 2);
begin
  if p_invoice_id is null or p_customer_id is null or p_amount_paid < 0 then
    raise exception 'invalid paid invoice payload' using errcode = '22023';
  end if;

  select profile.id, profile.referred_by
    into resolved_student_id, resolved_teacher_id
  from public.profiles as profile
  where (p_user_id is not null and profile.id = p_user_id)
     or profile.stripe_customer_id = p_customer_id
  order by case when profile.id = p_user_id then 0 else 1 end
  limit 1;

  insert into public.billing_invoices (
    stripe_invoice_id,
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_payment_intent_id,
    amount_paid,
    stripe_fee_amount,
    net_received,
    currency,
    plan_interval,
    status,
    paid_at,
    updated_at
  ) values (
    p_invoice_id,
    resolved_student_id,
    p_customer_id,
    p_subscription_id,
    p_payment_intent_id,
    p_amount_paid,
    greatest(coalesce(p_fee_amount, 0), 0),
    greatest(coalesce(p_net_amount, p_amount_paid), 0),
    lower(coalesce(p_currency, 'brl')),
    p_plan_interval,
    'paid',
    p_paid_at,
    now()
  )
  on conflict (stripe_invoice_id) do update set
    user_id = coalesce(excluded.user_id, public.billing_invoices.user_id),
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_payment_intent_id = excluded.stripe_payment_intent_id,
    amount_paid = excluded.amount_paid,
    stripe_fee_amount = excluded.stripe_fee_amount,
    net_received = excluded.net_received,
    currency = excluded.currency,
    plan_interval = excluded.plan_interval,
    status = 'paid',
    paid_at = excluded.paid_at,
    updated_at = now();

  if resolved_student_id is null
    or resolved_teacher_id is null
    or p_amount_paid = 0
    or lower(coalesce(p_currency, '')) <> 'brl' then
    return;
  end if;

  commission_amount := case
    when p_plan_interval = 'year' then 40.00
    when p_plan_interval = 'month' then 5.00
    else 0.00
  end;

  commission_amount := least(
    commission_amount,
    round(greatest(coalesce(p_net_amount, 0), 0)::numeric / 100, 2)
  );
  if commission_amount <= 0 then return; end if;

  insert into public.teacher_commission_entries (
    teacher_id,
    student_id,
    stripe_invoice_id,
    source_type,
    source_key,
    amount,
    currency,
    description,
    available_at
  ) values (
    resolved_teacher_id,
    resolved_student_id,
    p_invoice_id,
    'invoice',
    'invoice:' || p_invoice_id,
    commission_amount,
    lower(coalesce(p_currency, 'brl')),
    'Comissao por fatura Stripe paga',
    p_paid_at + interval '30 days'
  )
  on conflict (source_key) do nothing;
end;
$$;

create or replace function public.record_commission_reversal(
  p_invoice_id text,
  p_reference text,
  p_source_type text,
  p_refunded_amount bigint,
  p_invoice_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice_record public.billing_invoices%rowtype;
  original_entry public.teacher_commission_entries%rowtype;
  reversal_amount numeric(12, 2);
  reversal_base_amount bigint;
  pending_withdrawal_id uuid;
begin
  if p_source_type not in ('refund', 'dispute') or p_refunded_amount < 0 then
    raise exception 'invalid commission reversal payload' using errcode = '22023';
  end if;

  select * into invoice_record
  from public.billing_invoices
  where stripe_invoice_id = p_invoice_id
  for update;

  if not found then return; end if;

  reversal_base_amount := case
    when p_source_type = 'dispute' then p_refunded_amount
    else greatest(0, p_refunded_amount - invoice_record.amount_refunded)
  end;

  update public.billing_invoices set
    amount_refunded = case
      when p_source_type = 'refund' then greatest(amount_refunded, p_refunded_amount)
      else amount_refunded
    end,
    status = p_invoice_status,
    updated_at = now()
  where stripe_invoice_id = p_invoice_id;

  if reversal_base_amount = 0 then return; end if;

  select * into original_entry
  from public.teacher_commission_entries
  where source_key = 'invoice:' || p_invoice_id
  for update;

  if not found then return; end if;

  if invoice_record.amount_paid <= 0 then return; end if;
  reversal_amount := round(
    least(
      original_entry.amount,
      original_entry.amount * reversal_base_amount::numeric / invoice_record.amount_paid::numeric
    ),
    2
  );
  if reversal_amount <= 0 then return; end if;

  if original_entry.withdrawal_id is not null then
    select id into pending_withdrawal_id
    from public.withdrawals
    where id = original_entry.withdrawal_id and status = 'pendente'
    for update;

    if pending_withdrawal_id is not null then
      update public.withdrawals
      set status = 'rejeitado', updated_at = now()
      where id = pending_withdrawal_id;

      update public.teacher_commission_entries
      set withdrawal_id = null
      where withdrawal_id = pending_withdrawal_id and settled_at is null;
    end if;
  end if;

  insert into public.teacher_commission_entries (
    teacher_id,
    student_id,
    stripe_invoice_id,
    source_type,
    source_key,
    amount,
    currency,
    description,
    available_at
  ) values (
    original_entry.teacher_id,
    original_entry.student_id,
    p_invoice_id,
    p_source_type,
    p_source_type || ':' || p_reference,
    -reversal_amount,
    original_entry.currency,
    case when p_source_type = 'dispute'
      then 'Estorno de comissao por contestacao'
      else 'Estorno de comissao por reembolso'
    end,
    now()
  )
  on conflict (source_key) do nothing;
end;
$$;

create or replace function public.restore_disputed_commission(
  p_invoice_id text,
  p_reference text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  reversal_entry public.teacher_commission_entries%rowtype;
begin
  select * into reversal_entry
  from public.teacher_commission_entries
  where stripe_invoice_id = p_invoice_id
    and source_type = 'dispute'
    and source_key = 'dispute:' || p_reference
  limit 1;

  if not found or reversal_entry.amount >= 0 then return; end if;

  insert into public.teacher_commission_entries (
    teacher_id,
    student_id,
    stripe_invoice_id,
    source_type,
    source_key,
    amount,
    currency,
    description,
    available_at
  ) values (
    reversal_entry.teacher_id,
    reversal_entry.student_id,
    p_invoice_id,
    'adjustment',
    'adjustment:dispute-won:' || p_reference,
    -reversal_entry.amount,
    reversal_entry.currency,
    'Restauracao de comissao apos contestacao vencida',
    now()
  )
  on conflict (source_key) do nothing;

  update public.billing_invoices
  set status = 'paid', updated_at = now()
  where stripe_invoice_id = p_invoice_id;
end;
$$;

create or replace function public.request_teacher_withdrawal()
returns public.withdrawals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid := auth.uid();
  available_amount numeric(12, 2);
  created_withdrawal public.withdrawals%rowtype;
begin
  if v_teacher_id is null or not exists (
    select 1 from public.profiles where id = v_teacher_id and role = 'teacher'
  ) then
    raise exception 'teacher access required' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.withdrawals
    where withdrawals.teacher_id = v_teacher_id
      and status = 'pendente'
  ) then
    raise exception 'pending withdrawal already exists' using errcode = '23505';
  end if;

  perform id
  from public.teacher_commission_entries
  where teacher_commission_entries.teacher_id = v_teacher_id
    and available_at <= now()
    and withdrawal_id is null
    and settled_at is null
  for update;

  select coalesce(sum(amount), 0) into available_amount
  from public.teacher_commission_entries
  where teacher_commission_entries.teacher_id = v_teacher_id
    and available_at <= now()
    and withdrawal_id is null
    and settled_at is null;

  if available_amount <= 0 then
    raise exception 'no commission balance available' using errcode = '22023';
  end if;

  insert into public.withdrawals (teacher_id, amount, status)
  values (v_teacher_id, available_amount, 'pendente')
  returning * into created_withdrawal;

  update public.teacher_commission_entries
  set withdrawal_id = created_withdrawal.id
  where teacher_commission_entries.teacher_id = v_teacher_id
    and available_at <= now()
    and withdrawal_id is null
    and settled_at is null;

  return created_withdrawal;
end;
$$;

create or replace function public.review_teacher_withdrawal(
  p_withdrawal_id uuid,
  p_status text,
  p_receipt_path text default null
)
returns public.withdrawals
language plpgsql
security definer
set search_path = ''
as $$
declare
  withdrawal_record public.withdrawals%rowtype;
  paid_total numeric(12, 2);
begin
  if not public.is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  if p_status not in ('aprovado', 'rejeitado') then
    raise exception 'invalid withdrawal status' using errcode = '22023';
  end if;
  if p_status = 'aprovado' and p_receipt_path is null then
    raise exception 'receipt is required for a paid withdrawal' using errcode = '22023';
  end if;

  select * into withdrawal_record
  from public.withdrawals
  where id = p_withdrawal_id
  for update;

  if not found then
    raise exception 'withdrawal not found' using errcode = 'P0002';
  end if;
  if withdrawal_record.status <> 'pendente' then
    if withdrawal_record.status = p_status then return withdrawal_record; end if;
    raise exception 'withdrawal has already been reviewed' using errcode = '22023';
  end if;

  update public.withdrawals set
    status = p_status,
    receipt_path = p_receipt_path,
    updated_at = now()
  where id = p_withdrawal_id
  returning * into withdrawal_record;

  if p_status = 'rejeitado' then
    update public.teacher_commission_entries
    set withdrawal_id = null
    where withdrawal_id = p_withdrawal_id and settled_at is null;
  else
    update public.teacher_commission_entries
    set settled_at = now()
    where withdrawal_id = p_withdrawal_id and settled_at is null;
  end if;

  select coalesce(sum(amount), 0) into paid_total
  from public.withdrawals
  where teacher_id = withdrawal_record.teacher_id
    and status in ('aprovado', 'concluido');

  update public.profiles
  set balance_withdrawn_total = paid_total
  where id = withdrawal_record.teacher_id;

  return withdrawal_record;
end;
$$;

revoke execute on function public.claim_stripe_webhook_event(text, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.record_paid_invoice(text, text, text, text, bigint, bigint, bigint, text, timestamptz, text, uuid) from public, anon, authenticated;
revoke execute on function public.record_commission_reversal(text, text, text, bigint, text) from public, anon, authenticated;
revoke execute on function public.restore_disputed_commission(text, text) from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text, text, boolean) to service_role;
grant execute on function public.record_paid_invoice(text, text, text, text, bigint, bigint, bigint, text, timestamptz, text, uuid) to service_role;
grant execute on function public.record_commission_reversal(text, text, text, bigint, text) to service_role;
grant execute on function public.restore_disputed_commission(text, text) to service_role;

revoke execute on function public.request_teacher_withdrawal() from public, anon;
grant execute on function public.request_teacher_withdrawal() to authenticated, service_role;
revoke execute on function public.review_teacher_withdrawal(uuid, text, text) from public, anon;
grant execute on function public.review_teacher_withdrawal(uuid, text, text) to authenticated, service_role;

commit;
