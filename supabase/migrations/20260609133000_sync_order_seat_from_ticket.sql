update public.orders
set
  seat_id = first_ticket.seat_id,
  updated_at = now()
from (
  select distinct on (order_id)
    order_id,
    seat_id
  from public.tickets
  where seat_id is not null
  order by order_id, created_at
) as first_ticket
where orders.id = first_ticket.order_id
  and orders.seat_id is null;

create or replace function public.book_ticket(
  p_buyer_id uuid,
  p_event_id uuid,
  p_tier_id uuid,
  p_quantity integer,
  p_total_amount numeric,
  p_seat_ids uuid[] default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_tier public.ticket_tiers;
  new_order public.orders;
  selected_seat_id uuid;
  selected_seat_count integer;
  unavailable_seat_count integer;
  ticket_index integer := 0;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then
    raise exception 'You can only book tickets for your own account.'
      using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'Ticket quantity must be between 1 and 10.'
      using errcode = '22023';
  end if;

  select *
  into selected_tier
  from public.ticket_tiers
  where id = p_tier_id
    and event_id = p_event_id
  for update;

  if not found then
    raise exception 'Ticket tier was not found for this event.'
      using errcode = 'P0002';
  end if;

  if selected_tier.quantity - selected_tier.sold < p_quantity then
    raise exception 'Not enough tickets are available.'
      using errcode = '23514';
  end if;

  if selected_tier.section_id is not null then
    if p_seat_ids is null then
      raise exception 'Seat selection is required for this ticket tier.'
        using errcode = '23514';
    end if;

    select count(distinct seat_id)
    into selected_seat_count
    from unnest(p_seat_ids) as seat_id;

    if selected_seat_count <> p_quantity then
      raise exception 'Select exactly % seat(s).', p_quantity
        using errcode = '23514';
    end if;

    perform 1
    from public.seats
    where id = any(p_seat_ids)
      and section_id = selected_tier.section_id
    for update;

    select count(*)
    into unavailable_seat_count
    from unnest(p_seat_ids) as requested_seat_id
    where not exists (
      select 1
      from public.seats
      where seats.id = requested_seat_id
        and seats.section_id = selected_tier.section_id
    )
    or exists (
      select 1
      from public.tickets
      join public.orders on orders.id = tickets.order_id
      where tickets.seat_id = requested_seat_id
        and tickets.status = 'active'
        and (
          orders.status = 'paid'
          or (
            orders.status = 'pending'
            and coalesce(orders.expires_at, now()) > now()
          )
        )
    );

    if unavailable_seat_count > 0 then
      raise exception 'One or more selected seats are no longer available.'
        using errcode = '23514';
    end if;
  end if;

  update public.ticket_tiers
  set
    sold = sold + p_quantity,
    updated_at = now()
  where id = p_tier_id;

  insert into public.orders (
    buyer_id,
    event_id,
    total_amount,
    status,
    payment_method,
    payment_ref,
    paid_at,
    seat_id,
    expires_at,
    updated_at
  )
  values (
    p_buyer_id,
    p_event_id,
    p_total_amount,
    'pending',
    null,
    null,
    null,
    case when selected_tier.section_id is not null then p_seat_ids[1] else null end,
    now() + interval '10 minutes',
    now()
  )
  returning * into new_order;

  if selected_tier.section_id is not null then
    foreach selected_seat_id in array p_seat_ids loop
      insert into public.tickets (
        order_id,
        tier_id,
        buyer_id,
        seat_id,
        status
      )
      values (
        new_order.id,
        p_tier_id,
        p_buyer_id,
        selected_seat_id,
        'active'
      );
    end loop;
  else
    for ticket_index in 1..p_quantity loop
      insert into public.tickets (
        order_id,
        tier_id,
        buyer_id,
        status
      )
      values (
        new_order.id,
        p_tier_id,
        p_buyer_id,
        'active'
      );
    end loop;
  end if;

  return json_build_object(
    'order_id', new_order.id,
    'status', new_order.status,
    'expires_at', new_order.expires_at
  );
end;
$$;

revoke all on function public.book_ticket(uuid, uuid, uuid, integer, numeric, uuid[]) from public;
grant execute on function public.book_ticket(uuid, uuid, uuid, integer, numeric, uuid[]) to authenticated;
