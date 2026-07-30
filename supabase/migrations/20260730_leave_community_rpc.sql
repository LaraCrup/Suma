create or replace function public.leave_community(p_community_id uuid)
returns text
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
    v_user uuid := (select auth.uid());
    v_role text;
    v_new_admin uuid;
    v_remaining int;
begin
    if v_user is null then
        raise exception 'Usuario no autenticado.';
    end if;

    select role into v_role
    from community_members
    where community_id = p_community_id and user_id = v_user;

    if v_role is null then
        raise exception 'No sos miembro de esta comunidad.';
    end if;

    delete from community_members
    where community_id = p_community_id and user_id = v_user;

    select count(*) into v_remaining
    from community_members
    where community_id = p_community_id;

    if v_remaining = 0 then
        delete from communities where id = p_community_id;
        return 'deleted';
    end if;

    if not exists (
        select 1 from community_members
        where community_id = p_community_id and role = 'admin'
    ) then
        select user_id into v_new_admin
        from community_members
        where community_id = p_community_id
        order by random()
        limit 1;

        update community_members
        set role = 'admin'
        where community_id = p_community_id and user_id = v_new_admin;

        update communities
        set created_by = v_new_admin
        where id = p_community_id;

        return 'promoted';
    end if;

    return 'left';
end;
$$;

revoke execute on function public.leave_community(uuid) from public, anon;
grant execute on function public.leave_community(uuid) to authenticated;

update community_members cm
set role = 'admin'
where cm.user_id = (
        select user_id from community_members
        where community_id = cm.community_id
        order by joined_at
        limit 1
    )
  and not exists (
        select 1 from community_members inner_cm
        where inner_cm.community_id = cm.community_id
          and inner_cm.role = 'admin'
    );

update communities c
set created_by = (
        select cm.user_id from community_members cm
        where cm.community_id = c.id and cm.role = 'admin'
        order by cm.joined_at
        limit 1
    )
where not exists (
        select 1 from community_members cm
        where cm.community_id = c.id and cm.user_id = c.created_by
    )
  and exists (
        select 1 from community_members cm
        where cm.community_id = c.id and cm.role = 'admin'
    );
