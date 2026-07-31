alter table public.community_members
    add column if not exists join_xp_granted_at timestamptz;

update community_members
set join_xp_granted_at = now()
where join_xp_granted_at is null;

create or replace function public.claim_community_join_xp(p_community_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
    v_user uuid := (select auth.uid());
    v_claimed int;
begin
    if v_user is null then
        return false;
    end if;

    update community_members
    set join_xp_granted_at = now()
    where community_id = p_community_id
      and user_id = v_user
      and join_xp_granted_at is null;

    get diagnostics v_claimed = row_count;

    if v_claimed = 0 then
        return false;
    end if;

    return not exists (
        select 1 from communities
        where id = p_community_id and created_by = v_user
    );
end;
$$;

revoke execute on function public.claim_community_join_xp(uuid) from public, anon;
grant execute on function public.claim_community_join_xp(uuid) to authenticated;
