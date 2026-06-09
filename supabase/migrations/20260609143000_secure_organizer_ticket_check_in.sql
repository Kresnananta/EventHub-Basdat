create or replace function public.lookup_ticket_for_check_in(p_code text)
returns table (
  ticket_id uuid,
  ticket_code text,
  ticket_status text,
  checked_in_at timestamp with time zone,
  buyer_name text,
  buyer_phone text,
  order_id uuid,
  order_status text,
  total_amount numeric,
  event_id uuid,
  event_title text,
  starts_at timestamp with time zone,
  tier_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    tickets.id as ticket_id,
    tickets.ticket_code,
    tickets.status as ticket_status,
    tickets.checked_in_at,
    profiles.full_name as buyer_name,
    profiles.phone as buyer_phone,
    orders.id as order_id,
    orders.status as order_status,
    orders.total_amount,
    events.id as event_id,
    events.title as event_title,
    events.starts_at,
    ticket_tiers.name as tier_name
  from public.tickets
  join public.orders on orders.id = tickets.order_id
  join public.ticket_tiers on ticket_tiers.id = tickets.tier_id
  join public.events on events.id = ticket_tiers.event_id
  left join public.profiles on profiles.id = tickets.buyer_id
  where nullif(btrim(p_code), '') is not null
    and public.can_manage_event(events.organizer_id)
    and (
      upper(tickets.ticket_code) = upper(btrim(p_code))
      or tickets.id::text = btrim(p_code)
      or upper(coalesce(orders.ticket_code, '')) = upper(btrim(p_code))
    )
  order by
    case when upper(tickets.ticket_code) = upper(btrim(p_code)) then 0 else 1 end,
    tickets.created_at
  limit 1;
$$;

create or replace function public.check_in_ticket(p_ticket_id uuid)
returns table (
  ticket_status text,
  checked_in_at timestamp with time zone
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_ticket_status text;
  current_checked_in_at timestamp with time zone;
  current_order_status text;
begin
  select
    tickets.status,
    tickets.checked_in_at,
    orders.status
  into
    current_ticket_status,
    current_checked_in_at,
    current_order_status
  from public.tickets
  join public.orders on orders.id = tickets.order_id
  join public.ticket_tiers on ticket_tiers.id = tickets.tier_id
  join public.events on events.id = ticket_tiers.event_id
  where tickets.id = p_ticket_id
    and public.can_manage_event(events.organizer_id);

  if not found then
    raise exception 'Ticket was not found or cannot be managed by this account.'
      using errcode = '42501';
  end if;

  if current_order_status <> 'paid' then
    raise exception 'Only paid tickets can be checked in.'
      using errcode = '23514';
  end if;

  if current_ticket_status = 'used' or current_checked_in_at is not null then
    raise exception 'Ticket has already been checked in.'
      using errcode = '23514';
  end if;

  if current_ticket_status <> 'active' then
    raise exception 'Ticket is not active.'
      using errcode = '23514';
  end if;

  return query
  update public.tickets as checked_ticket
  set
    status = 'used',
    checked_in_at = now(),
    updated_at = now()
  where checked_ticket.id = p_ticket_id
    and checked_ticket.status = 'active'
    and checked_ticket.checked_in_at is null
  returning checked_ticket.status, checked_ticket.checked_in_at;

  if not found then
    raise exception 'Ticket check-in state changed. Please scan it again.'
      using errcode = '40001';
  end if;
end;
$$;

revoke all on function public.lookup_ticket_for_check_in(text) from public;
revoke all on function public.check_in_ticket(uuid) from public;

grant execute on function public.lookup_ticket_for_check_in(text) to authenticated;
grant execute on function public.check_in_ticket(uuid) to authenticated;
