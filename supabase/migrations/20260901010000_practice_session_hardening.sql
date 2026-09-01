-- Practice history is written only by the authenticated server endpoint, which
-- validates the catalog entry and entitlement before using the service role.
revoke insert on public.practice_sessions from authenticated;
drop policy if exists practice_sessions_insert_own on public.practice_sessions;

