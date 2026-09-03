begin;

-- Trigger functions execute as part of their triggers and must not be callable
-- directly through the exposed API roles.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_fields() from public, anon, authenticated;
revoke execute on function public.protect_profile_consent_fields() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Keep future functions private until a migration grants the exact roles that
-- need to call them.
alter default privileges for role postgres in schema public
revoke execute on functions from public;

-- Public buckets already serve direct public object URLs. A broad SELECT
-- policy also allowed clients to enumerate every avatar, which is unnecessary.
drop policy if exists avatars_public_read on storage.objects;
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'avatars'
  and name like ((select auth.uid())::text || '-%')
);

-- These tables are reached only through authenticated server routes or
-- narrowly-scoped SECURITY DEFINER functions.
revoke all on public.company_expenses from anon, authenticated;
revoke all on public.song_recommendations from anon, authenticated;
revoke all on public.withdrawals from anon, authenticated;

grant all on public.company_expenses to service_role;
grant all on public.song_recommendations to service_role;
grant all on public.withdrawals to service_role;

commit;
