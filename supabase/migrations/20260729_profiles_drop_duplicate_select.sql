drop policy if exists profiles_select on public.profiles;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
