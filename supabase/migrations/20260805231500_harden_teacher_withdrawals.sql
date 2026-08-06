-- Prevent concurrent or repeated payout requests from reserving the same balance.
-- Resolve any pre-existing duplicate pending requests before applying this migration.
create unique index if not exists withdrawals_one_pending_per_teacher
  on public.withdrawals (teacher_id)
  where status = 'pendente';
