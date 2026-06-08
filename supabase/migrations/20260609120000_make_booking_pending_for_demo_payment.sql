drop function if exists public.book_ticket(uuid, uuid, uuid, integer, numeric);

create or replace function public.book_ticket(
  p_buyer_id uuid,
  p_event_id uuid,
  p_tier_id uuid,
  p_quantity integer,
  p_total_amount numeric
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_tier public.ticket_tiers;
  new_order public.orders;
  ticket_index integer;
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

  return json_build_object(
    'order_id', new_order.id,
    'status', new_order.status,
    'expires_at', new_order.expires_at
  );
end;
$$;

revoke all on function public.book_ticket(uuid, uuid, uuid, integer, numeric) from public;
grant execute on function public.book_ticket(uuid, uuid, uuid, integer, numeric) to authenticated;

create or replace function public.confirm_demo_payment(
  p_order_id uuid,
  p_payment_method text
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_order public.orders;
  demo_ref text;
begin
  if p_payment_method not in ('bank_transfer', 'e_wallet', 'card') then
    raise exception 'Invalid payment method: %.', p_payment_method
      using errcode = '22023';
  end if;

  select concat(
    case
      when p_payment_method = 'bank_transfer' then 'SIM-BANK-'
      when p_payment_method = 'e_wallet' then 'SIM-WALLET-'
      else 'SIM-CARD-'
    end,
    upper(substring(p_order_id::text from 1 for 8))
  )
  into demo_ref;

  update public.orders
  set
    status = 'paid',
    payment_method = p_payment_method,
    payment_ref = demo_ref,
    paid_at = now(),
    updated_at = now()
  where id = p_order_id
    and buyer_id = auth.uid()
    and status in ('pending', 'paid')
    and coalesce(expires_at, now()) >= now()
  returning * into updated_order;

  if not found then
    raise exception 'Pending payment order was not found or has expired.'
      using errcode = 'P0002';
  end if;

  return updated_order;
end;
$$;

revoke all on function public.confirm_demo_payment(uuid, text) from public;
grant execute on function public.confirm_demo_payment(uuid, text) to authenticated;
