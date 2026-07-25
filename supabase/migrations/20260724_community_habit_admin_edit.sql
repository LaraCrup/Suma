create or replace function public.enforce_community_habit_admin_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if (new.name, new.icon, new.identity, new.unit, new.goal_value,
        new.frequency_type, new.frequency_option, new.frequency_detail)
       is distinct from
       (old.name, old.icon, old.identity, old.unit, old.goal_value,
        old.frequency_type, old.frequency_option, old.frequency_detail)
    then
        if auth.uid() is not null and not exists (
            select 1
            from public.community_members
            where community_id = old.community_id
              and user_id = auth.uid()
              and role = 'admin'
        ) then
            raise exception 'Solo el administrador de la comunidad puede editar el hábito';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists community_habits_admin_edit on public.community_habits;

create trigger community_habits_admin_edit
before update on public.community_habits
for each row
execute function public.enforce_community_habit_admin_edit();
