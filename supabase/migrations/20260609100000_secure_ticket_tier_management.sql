alter table public.ticket_tiers enable row level security;

drop policy if exists "Published event ticket tiers are publicly readable" on public.ticket_tiers;
drop policy if exists "Organizers can read managed event ticket tiers" on public.ticket_tiers;
drop policy if exists "Organizers can create managed event ticket tiers" on public.ticket_tiers;
drop policy if exists "Organizers can update managed event ticket tiers" on public.ticket_tiers;
drop policy if exists "Organizers can delete managed event ticket tiers" on public.ticket_tiers;

create policy "Published event ticket tiers are publicly readable"
on public.ticket_tiers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = ticket_tiers.event_id
      and events.status = 'published'
  )
);

create policy "Organizers can read managed event ticket tiers"
on public.ticket_tiers
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = ticket_tiers.event_id
      and public.can_manage_event(events.organizer_id)
  )
);

create policy "Organizers can create managed event ticket tiers"
on public.ticket_tiers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events
    where events.id = ticket_tiers.event_id
      and public.can_manage_event(events.organizer_id)
  )
);

create policy "Organizers can update managed event ticket tiers"
on public.ticket_tiers
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = ticket_tiers.event_id
      and public.can_manage_event(events.organizer_id)
  )
)
with check (
  exists (
    select 1
    from public.events
    where events.id = ticket_tiers.event_id
      and public.can_manage_event(events.organizer_id)
  )
);

create policy "Organizers can delete managed event ticket tiers"
on public.ticket_tiers
for delete
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = ticket_tiers.event_id
      and public.can_manage_event(events.organizer_id)
  )
);
