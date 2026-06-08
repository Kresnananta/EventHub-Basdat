create or replace function public.is_eventhub_staff()
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
      and role in ('organizer', 'admin')
  );
$$;

revoke all on function public.is_eventhub_staff() from public;
grant execute on function public.is_eventhub_staff() to authenticated;

alter table public.categories enable row level security;

drop policy if exists "Categories are publicly readable" on public.categories;
drop policy if exists "EventHub staff can create categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;

create policy "Categories are publicly readable"
on public.categories
for select
to anon, authenticated
using (true);

create policy "EventHub staff can create categories"
on public.categories
for insert
to authenticated
with check (public.is_eventhub_staff());

create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (public.is_eventhub_admin())
with check (public.is_eventhub_admin());

create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using (public.is_eventhub_admin());
