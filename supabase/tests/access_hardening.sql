-- Run only against an isolated local/staging database after all migrations.
-- Fixtures and helper functions are always rolled back. With psql use:
-- psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/access_hardening.sql
begin;
set local statement_timeout = '30s';

create schema access_test;
create function access_test.assert_true(ok boolean, message text)
returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'ASSERTION FAILED: %', message; end if;
end;
$$;
create function access_test.expect_rejected(statement text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege or check_violation or raise_exception then
    return;
  end;
  raise exception 'UNEXPECTED SUCCESS: %', statement;
end;
$$;
grant usage on schema access_test to anon, authenticated;
grant execute on all functions in schema access_test to anon, authenticated;

-- Synthetic IDs/emails only. The real signup trigger creates these profiles.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'owner-a@access-test.invalid', '{"full_name":"Owner A"}'),
  ('b1111111-1111-4111-8111-111111111111', 'owner-b@access-test.invalid', '{"full_name":"Owner B"}'),
  ('c1111111-1111-4111-8111-111111111111', 'buyer@access-test.invalid', '{"full_name":"Buyer"}'),
  ('f1111111-1111-4111-8111-111111111111', 'admin@access-test.invalid', '{"full_name":"Admin"}');
-- Fixture-only bootstrap of the first admin, then immediately restore guard.
alter table public.profiles disable trigger trg_prevent_role_escalation;
update public.profiles set role = 'admin' where id = 'f1111111-1111-4111-8111-111111111111';
alter table public.profiles enable trigger trg_prevent_role_escalation;
select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

insert into public.companies (id, owner_id, name, slug, status, cnpj, phone, whatsapp, site) values
  ('a0000000-0000-4000-8000-000000000001', 'a1111111-1111-4111-8111-111111111111', 'Access A', 'access-test-a', 'approved', 'A-private-cnpj', 'A-private-phone', '5531999990001', 'https://a.invalid'),
  ('b0000000-0000-4000-8000-000000000001', 'b1111111-1111-4111-8111-111111111111', 'Access B', 'access-test-b', 'approved', 'B-private-cnpj', 'B-private-phone', '5531999990002', 'https://b.invalid'),
  ('d0000000-0000-4000-8000-000000000001', 'b1111111-1111-4111-8111-111111111111', 'Access Pending', 'access-test-pending', 'pending', 'pending-private-cnpj', 'pending-private-phone', null, null);
insert into public.equipment (id, company_id, slug, title, price, mode, condition, status) values
  ('aeeeeeee-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'access-test-part-a', 'Part A', 100, 'venda', 'Usado', 'active'),
  ('beeeeeee-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'access-test-part-b', 'Part B', 200, 'venda', 'Usado', 'active'),
  ('deeeeeee-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'access-test-part-pending', 'Private Part', 300, 'venda', 'Usado', 'active');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select access_test.assert_true((select count(*) = 0 from public.companies where slug like 'access-test-%'), 'anon cannot read private companies');
select access_test.assert_true((select count(*) = 2 from public.companies_public where slug like 'access-test-%'), 'anon sees only approved companies');
select access_test.assert_true(not exists (select 1 from public.companies_public where slug like 'access-test-%' and (phone is not null or whatsapp is not null or site is not null or cnpj is not null)), 'public company projection has no contact/CNPJ');
select access_test.assert_true((select count(*) = 2 from public.equipment where slug like 'access-test-%'), 'equipment RLS hides unapproved company even through direct API');
select access_test.assert_true((select count(*) = 2 from public.equipment_public where slug like 'access-test-%'), 'public catalog remains available');
select access_test.assert_true(not exists (select 1 from public.equipment_public where slug like 'access-test-%' and (companies->>'phone' is not null or companies->>'whatsapp' is not null or companies->>'site' is not null)), 'public equipment has no nested contact');
select access_test.expect_rejected($q$select * from public.unlock_company_contact('b0000000-0000-4000-8000-000000000001')$q$);
select access_test.expect_rejected($q$select * from public.unlock_equipment_contact('beeeeeee-0000-4000-8000-000000000001')$q$);
select access_test.expect_rejected($q$select public.start_conversation('b0000000-0000-4000-8000-000000000001', null, 'Hello')$q$);
select access_test.expect_rejected($q$select public.log_listing_event('beeeeeee-0000-4000-8000-000000000001', 'contact_unlock')$q$);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select access_test.assert_true((select count(*) = 1 from public.companies where slug like 'access-test-%'), 'owner A sees only own private company');
select access_test.assert_true((select phone = 'A-private-phone' from public.companies where slug = 'access-test-a'), 'owner may edit own contact');
with changed as (update public.companies set phone = 'hacked' where slug = 'access-test-b' returning id)
select access_test.assert_true((select count(*) = 0 from changed), 'A cannot update B company');
select access_test.expect_rejected($q$update public.companies set rating = 5, reviews = 999 where slug = 'access-test-a'$q$);
select access_test.expect_rejected($q$update public.equipment set company_id = 'b0000000-0000-4000-8000-000000000001' where slug = 'access-test-part-a'$q$);
select access_test.expect_rejected($q$insert into public.equipment(company_id, slug, title, price, mode, condition) values ('b0000000-0000-4000-8000-000000000001', 'access-test-forged', 'Forged', 1, 'venda', 'Usado')$q$);
insert into public.companies (id, owner_id, name, slug, rating, reviews, status, verified)
values ('a0000000-0000-4000-8000-000000000002', auth.uid(), 'Forged Rating', 'access-test-owner-insert', 5, 999, 'approved', true);
select access_test.assert_true((select rating = 0 and reviews = 0 and status = 'pending' and verified = false from public.companies where slug = 'access-test-owner-insert'), 'owner insert cannot forge rating/status/verification');

select access_test.assert_true((select phone = 'B-private-phone' from public.unlock_equipment_contact('beeeeeee-0000-4000-8000-000000000001')), 'authenticated equipment contact unlock succeeds');
select * from public.unlock_equipment_contact('beeeeeee-0000-4000-8000-000000000001');
select access_test.assert_true((select count(*) = 1 from public.contact_unlocks where equipment_id = 'beeeeeee-0000-4000-8000-000000000001'), 'equipment unlock deduplicates lead');
select access_test.assert_true((select site = 'https://b.invalid' from public.unlock_company_contact('b0000000-0000-4000-8000-000000000001')), 'authenticated company contact unlock succeeds');
select * from public.unlock_company_contact('b0000000-0000-4000-8000-000000000001');
select access_test.assert_true((select count(*) = 1 from public.company_contact_unlocks where company_id = 'b0000000-0000-4000-8000-000000000001'), 'company unlock deduplicates lead');
select access_test.expect_rejected($q$insert into public.contact_unlocks (user_id, equipment_id) values (auth.uid(), 'aeeeeeee-0000-4000-8000-000000000001')$q$);
select access_test.expect_rejected($q$insert into public.company_contact_unlocks (user_id, company_id) values (auth.uid(), 'a0000000-0000-4000-8000-000000000001')$q$);
select access_test.expect_rejected($q$select * from public.unlock_company_contact('d0000000-0000-4000-8000-000000000001')$q$);
select access_test.expect_rejected($q$select * from public.unlock_equipment_contact('deeeeeee-0000-4000-8000-000000000001')$q$);
select access_test.expect_rejected($q$select public.log_listing_event('beeeeeee-0000-4000-8000-000000000001', 'message')$q$);

insert into public.reviews (company_id, author_id, rating, comment)
values ('b0000000-0000-4000-8000-000000000001', auth.uid(), 4, 'Real review');
select access_test.assert_true((select rating = 4 and reviews = 1 from public.companies_public where slug = 'access-test-b'), 'review insert refreshes derived rating');
update public.reviews set rating = 3 where company_id = 'b0000000-0000-4000-8000-000000000001' and author_id = auth.uid();
select access_test.assert_true((select rating = 3 and reviews = 1 from public.companies_public where slug = 'access-test-b'), 'review update refreshes derived rating');
select access_test.expect_rejected($q$update public.reviews set company_id = 'a0000000-0000-4000-8000-000000000001' where author_id = auth.uid()$q$);
select public.start_conversation('b0000000-0000-4000-8000-000000000001', 'beeeeeee-0000-4000-8000-000000000001', 'Hello B');
select public.start_conversation('b0000000-0000-4000-8000-000000000001', null, 'Company inquiry');
select public.start_conversation('b0000000-0000-4000-8000-000000000001', null, 'Second inquiry');
select access_test.assert_true((select count(*) = 1 from public.conversations where company_id = 'b0000000-0000-4000-8000-000000000001' and equipment_id is null and buyer_id = auth.uid()), 'company-only conversation is reused');
select access_test.expect_rejected($q$select public.start_conversation('b0000000-0000-4000-8000-000000000001', 'aeeeeeee-0000-4000-8000-000000000001', 'Mismatch')$q$);
select access_test.expect_rejected($q$insert into public.conversations (buyer_id, company_id, equipment_id) values (auth.uid(), 'b0000000-0000-4000-8000-000000000001', 'aeeeeeee-0000-4000-8000-000000000001')$q$);
select access_test.expect_rejected($q$insert into public.conversations (buyer_id, company_id, equipment_id) values (auth.uid(), 'b0000000-0000-4000-8000-000000000001', null)$q$);
select access_test.expect_rejected($q$insert into public.messages(conversation_id, sender_id, body) select id, auth.uid(), repeat('x', 4001) from public.conversations where buyer_id = auth.uid() limit 1$q$);
select access_test.expect_rejected($q$select public.start_conversation('d0000000-0000-4000-8000-000000000001', null, 'Private')$q$);
select access_test.expect_rejected($q$select public.start_conversation('b0000000-0000-4000-8000-000000000001', null, repeat('x', 4001))$q$);

-- A second unrelated account cannot inspect A's unlock history/messages.
select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select access_test.assert_true((select count(*) = 0 from public.company_contact_unlocks where company_id = 'b0000000-0000-4000-8000-000000000001'), 'buyer cannot read another account company leads');
select access_test.assert_true((select count(*) = 0 from public.contact_unlocks where equipment_id = 'beeeeeee-0000-4000-8000-000000000001'), 'buyer cannot read another account equipment leads');
select access_test.assert_true((select count(*) = 0 from public.conversations where company_id = 'b0000000-0000-4000-8000-000000000001'), 'unrelated buyer cannot read conversations');
insert into public.reviews (company_id, author_id, rating) values ('b0000000-0000-4000-8000-000000000001', auth.uid(), 5);
select access_test.assert_true((select rating = 4 and reviews = 2 from public.companies_public where slug = 'access-test-b'), 'independent reviews aggregate correctly');

select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select access_test.assert_true((select count(*) = 2 from public.companies where slug like 'access-test-%'), 'B sees own approved/pending companies only');
select access_test.assert_true((select count(*) = 2 from public.notifications where user_id = auth.uid() and type = 'novo_lead'), 'one notification per equipment/company unlock');
select access_test.assert_true((select count(*) = 2 from public.conversations where company_id = 'b0000000-0000-4000-8000-000000000001'), 'owner can read received conversations');
select access_test.expect_rejected($q$insert into public.reviews(company_id, author_id, rating) values ('b0000000-0000-4000-8000-000000000001', auth.uid(), 5)$q$);
update public.companies set status = 'approved', verified = true where slug = 'access-test-pending';
select access_test.assert_true((select status = 'pending' and verified = false from public.companies where slug = 'access-test-pending'), 'owner cannot self-approve or verify');
select access_test.expect_rejected($q$update public.companies set rating = 5, reviews = 999 where slug = 'access-test-b'$q$);

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
delete from public.reviews where company_id = 'b0000000-0000-4000-8000-000000000001' and author_id = auth.uid();
select access_test.assert_true((select rating = 5 and reviews = 1 from public.companies_public where slug = 'access-test-b'), 'review delete refreshes derived rating');

-- Admin controls remain available; rejection immediately hides existing stock.
select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select access_test.assert_true((select count(*) = 4 from public.companies where slug like 'access-test-%'), 'admin sees all private company rows');
update public.companies set status = 'approved', verified = true where slug = 'access-test-pending';
select access_test.assert_true((select status = 'approved' and verified = true from public.companies where slug = 'access-test-pending'), 'admin can approve/verify');
update public.companies set status = 'rejected' where slug = 'access-test-a';
select access_test.assert_true((select count(*) = 3 from public.equipment where slug like 'access-test-%'), 'admin retains private equipment access');
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select access_test.assert_true(not exists (select 1 from public.equipment where slug = 'access-test-part-a'), 'rejection hides existing active equipment through direct table API');
select access_test.assert_true(not exists (select 1 from public.equipment_public where slug = 'access-test-part-a'), 'rejection hides existing active equipment in catalog');
select access_test.assert_true(exists (select 1 from public.equipment_public where slug = 'access-test-part-pending'), 'approval publishes existing stock');
select public.increment_equipment_views('aeeeeeee-0000-4000-8000-000000000001');
select public.increment_equipment_views('beeeeeee-0000-4000-8000-000000000001');
reset role;
select access_test.assert_true((select views = 0 from public.equipment where slug = 'access-test-part-a'), 'hidden listing views cannot be incremented');
select access_test.assert_true((select views = 1 from public.equipment where slug = 'access-test-part-b'), 'public listing view counter still works');

rollback;
