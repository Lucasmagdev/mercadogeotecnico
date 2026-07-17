-- =========================================================
-- Leads: notify company owner on contact unlock.
-- Realtime: publish messages/conversations/notifications.
-- Storage: allow owners to update their own images.
-- =========================================================

create function public.notify_lead_on_unlock()
returns trigger as $$
declare
  owner uuid;
  eq_title text;
begin
  select c.owner_id, e.title into owner, eq_title
  from public.equipment e
  join public.companies c on c.id = e.company_id
  where e.id = new.equipment_id;

  -- Don't notify the owner about their own unlock.
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      owner,
      'novo_lead',
      'Novo lead!',
      'Uma empresa desbloqueou o contato do anúncio "' || coalesce(eq_title, 'equipamento') || '".',
      '/painel'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_lead_on_unlock
  after insert on public.contact_unlocks
  for each row execute function public.notify_lead_on_unlock();

-- Realtime (postgres_changes respects RLS policies).
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;

-- Storage: update was missing (insert/delete already exist).
create policy "equipment_images_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'equipment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
