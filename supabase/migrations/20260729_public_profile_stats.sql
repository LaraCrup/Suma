create or replace function public.public_profile_stats(p_user_id uuid)
returns table (habit_count integer, friend_count integer, community_count integer)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
    select
        (select count(*) from habits where user_id = p_user_id)::int,
        (select count(*) from friend_requests
            where status = 'accepted'
              and (sender_id = p_user_id or receiver_id = p_user_id))::int,
        (select count(*) from community_members where user_id = p_user_id)::int;
$$;

revoke execute on function public.public_profile_stats(uuid) from public, anon;
grant execute on function public.public_profile_stats(uuid) to authenticated;
