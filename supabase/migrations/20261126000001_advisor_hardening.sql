-- Supabase advisor cleanup (security + performance).
--
-- Intentionally NOT changed:
--   * companies_public / reviews_public stay SECURITY DEFINER (security_invoker = false).
--     They exist to expose a masked subset of companies (no cnpj/phone/whatsapp/site)
--     and the reviewer's display name from profiles to anon, without granting anon
--     direct SELECT on those tables. Switching them to invoker would either break the
--     public catalog or leak contact data.
--   * is_admin / is_company_approved / is_conversation_participant / is_public_equipment
--     keep EXECUTE for anon/authenticated: RLS policies call them with the caller's role.
--   * increment_equipment_views keeps anon EXECUTE: the public listing page calls it.

-- 1. Trigger functions are never meant to be called through /rest/v1/rpc.
--    Triggers fire regardless of EXECUTE privilege, so revoking is safe.
revoke all on function public.enforce_banner_requires_verification() from public, anon, authenticated;
revoke all on function public.equipment_search_tsv_update() from public, anon, authenticated;
revoke all on function public.force_pending_on_insert() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.log_favorite_event() from public, anon, authenticated;
revoke all on function public.log_message_event() from public, anon, authenticated;
revoke all on function public.log_unlock_event() from public, anon, authenticated;
revoke all on function public.notify_company_status_change() from public, anon, authenticated;
revoke all on function public.notify_lead_on_unlock() from public, anon, authenticated;
revoke all on function public.prevent_review_reassignment() from public, anon, authenticated;
revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
revoke all on function public.prevent_self_review() from public, anon, authenticated;
revoke all on function public.prevent_status_self_approval() from public, anon, authenticated;
revoke all on function public.protect_company_rating() from public, anon, authenticated;
revoke all on function public.refresh_company_rating() from public, anon, authenticated;
revoke all on function public.touch_conversation_and_notify() from public, anon, authenticated;

-- 2. Fixed search_path on the full-text trigger (only uses pg_catalog functions).
alter function public.equipment_search_tsv_update() set search_path = '';

-- 3. reviews_public is read-only; drop the write grants it inherited by default.
revoke all on public.reviews_public from public, anon, authenticated;
grant select on public.reviews_public to anon, authenticated;

-- 4. RLS: evaluate auth.uid() once per statement instead of once per row.
alter policy "companies_insert_own" on public.companies
  with check ((owner_id = (select auth.uid())));

alter policy "companies_select_own_or_admin" on public.companies
  using (((owner_id = (select auth.uid())) or is_admin()));

alter policy "companies_update_own_or_admin" on public.companies
  using (((owner_id = (select auth.uid())) or is_admin()));

alter policy "company_unlocks_select_own_or_admin" on public.company_contact_unlocks
  using (((user_id = (select auth.uid())) or is_admin()));

alter policy "unlocks_select_own_or_admin" on public.contact_unlocks
  using (((user_id = (select auth.uid())) or is_admin()));

alter policy "conversations_insert_buyer_available_company" on public.conversations
  with check (((buyer_id = (select auth.uid())) and is_company_approved(company_id)
    and ((equipment_id is null) or is_public_equipment(equipment_id, company_id))));

alter policy "conversations_select_participant" on public.conversations
  using (((buyer_id = (select auth.uid())) or (exists (select 1 from public.companies co
    where co.id = conversations.company_id and co.owner_id = (select auth.uid())))));

alter policy "equipment_delete_own_or_admin" on public.equipment
  using ((is_admin() or (exists (select 1 from public.companies c
    where c.id = equipment.company_id and c.owner_id = (select auth.uid())))));

alter policy "equipment_insert_approved_company" on public.equipment
  with check ((exists (select 1 from public.companies c
    where c.id = equipment.company_id and c.owner_id = (select auth.uid()) and c.status = 'approved')));

alter policy "equipment_select_public_or_owner_or_admin" on public.equipment
  using ((((status = 'active') and is_company_approved(company_id)) or is_admin()
    or (exists (select 1 from public.companies c
      where c.id = equipment.company_id and c.owner_id = (select auth.uid())))));

alter policy "equipment_update_own_or_admin" on public.equipment
  using ((is_admin() or (exists (select 1 from public.companies c
    where c.id = equipment.company_id and c.owner_id = (select auth.uid())))));

alter policy "favorites_delete_own" on public.favorites
  using ((user_id = (select auth.uid())));

alter policy "favorites_insert_own" on public.favorites
  with check ((user_id = (select auth.uid())));

alter policy "favorites_select_own" on public.favorites
  using ((user_id = (select auth.uid())));

alter policy "listing_events_select_owner_or_admin" on public.listing_events
  using ((is_admin() or (exists (select 1 from public.companies c
    where c.id = listing_events.company_id and c.owner_id = (select auth.uid())))));

alter policy "messages_insert_participant" on public.messages
  with check (((sender_id = (select auth.uid())) and is_conversation_participant(conversation_id)));

alter policy "notifications_select_own" on public.notifications
  using ((user_id = (select auth.uid())));

alter policy "notifications_update_own" on public.notifications
  using ((user_id = (select auth.uid())));

alter policy "profiles_insert_own" on public.profiles
  with check ((id = (select auth.uid())));

alter policy "profiles_select_own_or_admin" on public.profiles
  using (((id = (select auth.uid())) or is_admin()));

alter policy "profiles_update_own_or_admin" on public.profiles
  using (((id = (select auth.uid())) or is_admin()));

alter policy "reviews_delete_own_or_admin" on public.reviews
  using (((author_id = (select auth.uid())) or is_admin()));

alter policy "reviews_insert_own_approved_company" on public.reviews
  with check (((author_id = (select auth.uid())) and is_company_approved(company_id)));

alter policy "reviews_update_own" on public.reviews
  using ((author_id = (select auth.uid())));

-- 5. Covering indexes for foreign keys.
create index if not exists companies_owner_id_idx on public.companies (owner_id);
create index if not exists contact_unlocks_equipment_id_idx on public.contact_unlocks (equipment_id);
create index if not exists conversations_company_id_idx on public.conversations (company_id);
create index if not exists conversations_equipment_id_idx on public.conversations (equipment_id);
create index if not exists equipment_category_slug_idx on public.equipment (category_slug);
create index if not exists favorites_equipment_id_idx on public.favorites (equipment_id);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists reviews_author_id_idx on public.reviews (author_id);
