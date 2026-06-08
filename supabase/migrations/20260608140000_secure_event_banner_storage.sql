insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banners',
  'banners',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Event banners are publicly readable" on storage.objects;
drop policy if exists "Organizers can upload event banners" on storage.objects;
drop policy if exists "Organizers can update event banners" on storage.objects;
drop policy if exists "Organizers can delete event banners" on storage.objects;

create policy "Event banners are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'banners');

create policy "Organizers can upload event banners"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'banners'
  and exists (
    select 1
    from public.events
    where events.id::text = (storage.foldername(name))[2]
      and events.organizer_id::text = (storage.foldername(name))[1]
      and public.can_manage_event(events.organizer_id)
  )
);

create policy "Organizers can update event banners"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'banners'
  and exists (
    select 1
    from public.events
    where events.id::text = (storage.foldername(name))[2]
      and events.organizer_id::text = (storage.foldername(name))[1]
      and public.can_manage_event(events.organizer_id)
  )
)
with check (
  bucket_id = 'banners'
  and exists (
    select 1
    from public.events
    where events.id::text = (storage.foldername(name))[2]
      and events.organizer_id::text = (storage.foldername(name))[1]
      and public.can_manage_event(events.organizer_id)
  )
);

create policy "Organizers can delete event banners"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'banners'
  and exists (
    select 1
    from public.events
    where events.id::text = (storage.foldername(name))[2]
      and events.organizer_id::text = (storage.foldername(name))[1]
      and public.can_manage_event(events.organizer_id)
  )
);
