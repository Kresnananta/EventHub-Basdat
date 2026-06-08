create or replace function public.is_eventhub_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_eventhub_admin() from public;
grant execute on function public.is_eventhub_admin() to authenticated;

alter table public.venues enable row level security;

drop policy if exists "Venues are publicly readable" on public.venues;
drop policy if exists "Admins can create venues" on public.venues;
drop policy if exists "Admins can update venues" on public.venues;
drop policy if exists "Admins can delete venues" on public.venues;

create policy "Venues are publicly readable"
on public.venues
for select
to anon, authenticated
using (true);

create policy "Admins can create venues"
on public.venues
for insert
to authenticated
with check (public.is_eventhub_admin());

create policy "Admins can update venues"
on public.venues
for update
to authenticated
using (public.is_eventhub_admin())
with check (public.is_eventhub_admin());

create policy "Admins can delete venues"
on public.venues
for delete
to authenticated
using (public.is_eventhub_admin());

create or replace function public.assert_event_within_venue_capacity(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  venue_capacity integer;
  ticket_capacity bigint;
begin
  select venues.capacity
  into venue_capacity
  from public.events
  join public.venues on venues.id = events.venue_id
  where events.id = p_event_id;

  if venue_capacity is null then
    return;
  end if;

  select coalesce(sum(quantity), 0)
  into ticket_capacity
  from public.ticket_tiers
  where event_id = p_event_id;

  if ticket_capacity > venue_capacity then
    raise exception
      'Total ticket capacity (%) exceeds venue capacity (%) for event %.',
      ticket_capacity,
      venue_capacity,
      p_event_id
      using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.assert_event_within_venue_capacity(uuid) from public;

create or replace function public.check_ticket_tier_venue_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.assert_event_within_venue_capacity(old.event_id);
    return old;
  end if;

  perform public.assert_event_within_venue_capacity(new.event_id);

  if tg_op = 'UPDATE' and old.event_id is distinct from new.event_id then
    perform public.assert_event_within_venue_capacity(old.event_id);
  end if;

  return new;
end;
$$;

revoke all on function public.check_ticket_tier_venue_capacity() from public;

drop trigger if exists check_ticket_tier_venue_capacity on public.ticket_tiers;
create constraint trigger check_ticket_tier_venue_capacity
after insert or update or delete on public.ticket_tiers
deferrable initially immediate
for each row
execute function public.check_ticket_tier_venue_capacity();

create or replace function public.check_event_venue_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_event_within_venue_capacity(new.id);
  return new;
end;
$$;

revoke all on function public.check_event_venue_capacity() from public;

drop trigger if exists check_event_venue_capacity on public.events;
create constraint trigger check_event_venue_capacity
after insert or update of venue_id on public.events
deferrable initially immediate
for each row
execute function public.check_event_venue_capacity();

create or replace function public.check_updated_venue_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_event_id uuid;
begin
  if new.capacity is not distinct from old.capacity then
    return new;
  end if;

  for linked_event_id in
    select id
    from public.events
    where venue_id = new.id
  loop
    perform public.assert_event_within_venue_capacity(linked_event_id);
  end loop;

  return new;
end;
$$;

revoke all on function public.check_updated_venue_capacity() from public;

drop trigger if exists check_updated_venue_capacity on public.venues;
create constraint trigger check_updated_venue_capacity
after update of capacity on public.venues
deferrable initially immediate
for each row
execute function public.check_updated_venue_capacity();
