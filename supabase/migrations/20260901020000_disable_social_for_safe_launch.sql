-- Launch-safe default: social discovery, friendships and direct messages remain
-- disabled until guardian consent, reporting, blocking and moderation exist.
revoke all on public.public_profiles from anon, authenticated;
revoke all on public.friendships from anon, authenticated;
revoke all on public.messages from anon, authenticated;
revoke execute on function public.are_friends(uuid, uuid) from authenticated;

