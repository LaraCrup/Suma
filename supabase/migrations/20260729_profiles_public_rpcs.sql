create or replace function public.email_for_username(p_display_name text)
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
    select email
    from profiles
    where display_name = p_display_name;
$$;

create or replace function public.display_name_taken(p_display_name text)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
    select exists (
        select 1
        from profiles
        where display_name = p_display_name
    );
$$;

create or replace function public.email_taken(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
    select exists (
        select 1
        from profiles
        where email = p_email
    );
$$;

create or replace function public.my_profile()
returns profiles
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
    select *
    from profiles
    where id = auth.uid();
$$;

revoke execute on function public.my_profile() from public, anon;
grant execute on function public.my_profile() to authenticated;

revoke execute on function public.email_for_username(text) from public;
revoke execute on function public.display_name_taken(text) from public;
revoke execute on function public.email_taken(text) from public;

grant execute on function public.email_for_username(text) to anon, authenticated;
grant execute on function public.display_name_taken(text) to anon, authenticated;
grant execute on function public.email_taken(text) to anon, authenticated;
