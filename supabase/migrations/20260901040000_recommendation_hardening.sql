-- Premium recommendations are written only through the validated server route.
revoke insert on public.song_recommendations from authenticated;
drop policy if exists recommendations_insert_own on public.song_recommendations;
