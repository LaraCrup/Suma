drop policy if exists "anyone auth can insert members" on public.community_members;

drop policy if exists community_members_insert on public.community_members;

create policy community_members_insert on public.community_members
for insert
to authenticated
with check (
    (
        user_id = (select auth.uid())
        and role = 'admin'
        and exists (
            select 1
            from public.communities c
            where c.id = community_id
              and c.created_by = (select auth.uid())
        )
    )
    or (
        role = 'member'
        and (
            exists (
                select 1
                from public.communities c
                where c.id = community_id
                  and c.created_by = (select auth.uid())
            )
            or public.is_community_admin(community_id)
        )
    )
);
