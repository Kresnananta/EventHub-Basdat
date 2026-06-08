create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    new.email,
    'buyer'
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    email = coalesce(excluded.email, profiles.email),
    updated_at = now();

  return new;
end;
$$;

create or replace function public.protect_profile_role_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_count integer;
begin
  if tg_op = 'INSERT' then
    new.role := coalesce(new.role, 'buyer');

    if new.role not in ('buyer', 'organizer', 'admin') then
      raise exception 'Invalid profile role: %.', new.role
        using errcode = '23514';
    end if;

    if new.role <> 'buyer' and not public.is_eventhub_admin() then
      raise exception 'Only EventHub admins can create elevated user roles.'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if new.role is not distinct from old.role then
    return new;
  end if;

  if new.role not in ('buyer', 'organizer', 'admin') then
    raise exception 'Invalid profile role: %.', new.role
      using errcode = '23514';
  end if;

  if not public.is_eventhub_admin() then
    raise exception 'Only EventHub admins can update user roles.'
      using errcode = '42501';
  end if;

  if old.id = auth.uid() and new.role <> 'admin' then
    raise exception 'Admins cannot remove their own admin role.'
      using errcode = '42501';
  end if;

  if old.role = 'admin' and new.role <> 'admin' then
    select count(*)
    into admin_count
    from public.profiles
    where role = 'admin';

    if admin_count <= 1 then
      raise exception 'At least one admin account must remain active.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_role_changes() from public;

drop trigger if exists prevent_unauthorized_profile_role_change on public.profiles;
create trigger prevent_unauthorized_profile_role_change
before insert or update of role on public.profiles
for each row
execute function public.protect_profile_role_changes();

create or replace function public.admin_update_profile_role(
  p_profile_id uuid,
  p_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.profiles;
begin
  if not public.is_eventhub_admin() then
    raise exception 'Only EventHub admins can update user roles.'
      using errcode = '42501';
  end if;

  if p_role not in ('buyer', 'organizer', 'admin') then
    raise exception 'Invalid profile role: %.', p_role
      using errcode = '23514';
  end if;

  update public.profiles
  set
    role = p_role,
    updated_at = now()
  where id = p_profile_id
  returning * into updated_profile;

  if not found then
    raise exception 'Profile % was not found.', p_profile_id
      using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.admin_update_profile_role(uuid, text) from public;
grant execute on function public.admin_update_profile_role(uuid, text) to authenticated;
