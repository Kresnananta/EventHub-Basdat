create or replace function public.can_manage_event(p_organizer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() = p_organizer_id or public.is_eventhub_admin();
$$;

revoke all on function public.can_manage_event(uuid) from public;
grant execute on function public.can_manage_event(uuid) to authenticated;

alter table public.events enable row level security;

drop policy if exists "Published events are publicly readable" on public.events;
drop policy if exists "Organizers can read owned events" on public.events;
drop policy if exists "Organizers can create events" on public.events;
drop policy if exists "Organizers can update owned events" on public.events;
drop policy if exists "Organizers can delete owned events" on public.events;

create policy "Published events are publicly readable"
on public.events
for select
to anon, authenticated
using (status = 'published');

create policy "Organizers can read owned events"
on public.events
for select
to authenticated
using (public.can_manage_event(organizer_id));

create policy "Organizers can create events"
on public.events
for insert
to authenticated
with check (
  public.can_manage_event(organizer_id)
  and venue_id is not null
);

create policy "Organizers can update owned events"
on public.events
for update
to authenticated
using (public.can_manage_event(organizer_id))
with check (
  public.can_manage_event(organizer_id)
  and venue_id is not null
);

create policy "Organizers can delete owned events"
on public.events
for delete
to authenticated
using (public.can_manage_event(organizer_id));

do $$
begin
  if exists (select 1 from public.events where venue_id is null) then
    raise exception 'Cannot require venue_id while events without a venue still exist.';
  end if;
end;
$$;

alter table public.events
  alter column venue_id set not null;

alter table public.events
  drop column if exists location;
