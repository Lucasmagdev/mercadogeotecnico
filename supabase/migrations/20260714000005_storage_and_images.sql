-- Public bucket for equipment listing photos.
insert into storage.buckets (id, name, public)
values ('equipment-images', 'equipment-images', true)
on conflict (id) do nothing;

-- Anyone can view; only authenticated users can upload/delete, and only
-- inside their own folder ({user_id}/...).
create policy "equipment_images_read" on storage.objects
  for select using (bucket_id = 'equipment-images');

create policy "equipment_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'equipment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "equipment_images_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'equipment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Uploaded photo paths; image_key remains as fallback for seeded rows.
alter table public.equipment add column images text[] not null default '{}';
