create or replace function public.get_my_ticket_seats(
  p_ticket_ids uuid[]
)
returns table (
  ticket_id uuid,
  seat_id uuid,
  seat_number text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    tickets.id as ticket_id,
    tickets.seat_id,
    seats.seat_number
  from public.tickets
  join public.seats on seats.id = tickets.seat_id
  where tickets.id = any(p_ticket_ids)
    and tickets.buyer_id = auth.uid();
$$;

revoke all on function public.get_my_ticket_seats(uuid[]) from public;
grant execute on function public.get_my_ticket_seats(uuid[]) to authenticated;
