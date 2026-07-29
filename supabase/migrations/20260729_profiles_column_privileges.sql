drop policy if exists "Enable read access for all users" on public.profiles;

drop policy if exists profiles_select_public on public.profiles;

create policy profiles_select_public on public.profiles
for select
to authenticated
using (true);

revoke select on public.profiles from anon;
revoke select on public.profiles from authenticated;
revoke insert on public.profiles from anon;

grant select (id, display_name, avatar_url, experience_points, current_level)
on public.profiles to authenticated;
