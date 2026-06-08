alter table public.ticket_tiers
  add column if not exists section_id uuid references public.sections(id);

alter table public.tickets
  add column if not exists seat_id uuid references public.seats(id);

create unique index if not exists seats_section_seat_number_unique
on public.seats (section_id, seat_number)
where section_id is not null;

do $$
declare
  tier record;
  generated_section_id uuid;
  seat_index integer;
begin
  for tier in
    select id, event_id, name, price, quantity
    from public.ticket_tiers
    where section_id is null
  loop
    insert into public.sections (event_id, name, price, capacity, is_seated)
    values (tier.event_id, tier.name, tier.price, tier.quantity, true)
    returning id into generated_section_id;

    update public.ticket_tiers
    set section_id = generated_section_id
    where id = tier.id;

    for seat_index in 1..greatest(tier.quantity, 0) loop
      insert into public.seats (section_id, seat_number, is_available)
      values (generated_section_id, concat(upper(left(regexp_replace(tier.name, '[^A-Za-z0-9]', '', 'g'), 1)), seat_index), true)
      on conflict do nothing;
    end loop;
  end loop;
end;
$$;

create or replace function public.create_ticket_tier_seating(
  p_tier_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  tier public.ticket_tiers;
  generated_section_id uuid;
  seat_prefix text;
  seat_index integer;
begin
  select *
  into tier
  from public.ticket_tiers
  where id = p_tier_id;

  if not found then
    raise exception 'Ticket tier % was not found.', p_tier_id
      using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.events
    where id = tier.event_id
      and public.can_manage_event(organizer_id)
  ) then
    raise exception 'You cannot manage seating for this ticket tier.'
      using errcode = '42501';
  end if;

  if tier.section_id is null then
    insert into public.sections (event_id, name, price, capacity, is_seated)
    values (tier.event_id, tier.name, tier.price, tier.quantity, true)
    returning id into generated_section_id;

    update public.ticket_tiers
    set section_id = generated_section_id
    where id = tier.id;
  else
    generated_section_id := tier.section_id;

    update public.sections
    set
      name = tier.name,
      price = tier.price,
      capacity = tier.quantity,
      is_seated = true
    where id = generated_section_id;
  end if;

  seat_prefix := upper(left(regexp_replace(tier.name, '[^A-Za-z0-9]', '', 'g'), 1));
  if seat_prefix = '' then
    seat_prefix := 'S';
  end if;

  for seat_index in 1..greatest(tier.quantity, 0) loop
    insert into public.seats (section_id, seat_number, is_available)
    values (generated_section_id, concat(seat_prefix, seat_index), true)
    on conflict do nothing;
  end loop;
end;
$$;

revoke all on function public.create_ticket_tier_seating(uuid) from public;
grant execute on function public.create_ticket_tier_seating(uuid) to authenticated;

create or replace function public.get_ticket_tier_seats(
  p_tier_id uuid
)
returns table (
  seat_id uuid,
  seat_number text,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    seats.id as seat_id,
    seats.seat_number,
    case
      when exists (
        select 1
        from public.tickets
        join public.orders on orders.id = tickets.order_id
        where tickets.seat_id = seats.id
          and tickets.status = 'active'
          and (
            orders.status = 'paid'
            or (
              orders.status = 'pending'
              and coalesce(orders.expires_at, now()) > now()
            )
          )
      ) then 'unavailable'
      else 'available'
    end as status
  from public.ticket_tiers
  join public.seats on seats.section_id = ticket_tiers.section_id
  where ticket_tiers.id = p_tier_id
  order by
    length(seats.seat_number),
    seats.seat_number;
$$;

revoke all on function public.get_ticket_tier_seats(uuid) from public;
grant execute on function public.get_ticket_tier_seats(uuid) to anon, authenticated;

drop function if exists public.book_ticket(uuid, uuid, uuid, integer, numeric);

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
