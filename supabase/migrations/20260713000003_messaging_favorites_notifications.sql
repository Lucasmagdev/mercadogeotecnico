-- =========================================================
-- Phase 2: favorites, messaging, notifications, view counts
-- =========================================================

-- ---------- favorites ----------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, equipment_id)
);

alter table public.favorites enable row level security;
create policy "favorites_select_own" on public.favorites for select using (user_id = auth.uid());
create policy "favorites_insert_own" on public.favorites for insert with check (user_id = auth.uid());
create policy "favorites_delete_own" on public.favorites for delete using (user_id = auth.uid());

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('mensagem','empresa_aprovada','empresa_rejeitada','novo_lead')),
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid());

-- notify company owner when their company is approved/rejected
create function public.notify_company_status_change()
returns trigger as $$
begin
  if new.status <> old.status and new.status in ('approved','rejected') then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.owner_id,
      case when new.status = 'approved' then 'empresa_aprovada' else 'empresa_rejeitada' end,
      case when new.status = 'approved' then 'Empresa aprovada!' else 'Cadastro não aprovado' end,
      case when new.status = 'approved'
        then 'Sua empresa ' || new.name || ' foi aprovada. Você já pode anunciar equipamentos.'
        else 'O cadastro da empresa ' || new.name || ' não foi aprovado.'
      end,
      '/painel'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_company_status
  after update on public.companies
  for each row execute function public.notify_company_status_change();

-- ---------- conversations & messages ----------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.equipment(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (buyer_id, company_id, equipment_id)
);

create function public.is_conversation_participant(conv_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.conversations c
    left join public.companies co on co.id = c.company_id
    where c.id = conv_id and (c.buyer_id = auth.uid() or co.owner_id = auth.uid())
  );
$$ language sql security definer stable set search_path = public;

alter table public.conversations enable row level security;
create policy "conversations_select_participant" on public.conversations
  for select using (
    buyer_id = auth.uid()
    or exists (select 1 from public.companies co where co.id = company_id and co.owner_id = auth.uid())
  );
create policy "conversations_insert_buyer" on public.conversations
  for insert with check (buyer_id = auth.uid());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
create policy "messages_select_participant" on public.messages
  for select using (public.is_conversation_participant(conversation_id));
create policy "messages_insert_participant" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

create function public.touch_conversation_and_notify()
returns trigger as $$
declare
  conv public.conversations%rowtype;
  recipient uuid;
  sender_name text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;

  select coalesce(full_name, 'Alguém') into sender_name from public.profiles where id = new.sender_id;

  select owner_id into recipient from public.companies where id = conv.company_id;
  if new.sender_id = recipient then
    recipient := conv.buyer_id;
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (recipient, 'mensagem', 'Nova mensagem', sender_name || ': ' || left(new.body, 80), '/mensagens');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_and_notify();

-- RPC: start (or reuse) a conversation with a company, optionally about one equipment, with a first message
create function public.start_conversation(comp_id uuid, eq_id uuid, first_message text)
returns uuid as $$
declare
  conv_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select id into conv_id from public.conversations
  where buyer_id = auth.uid() and company_id = comp_id
    and (equipment_id = eq_id or (equipment_id is null and eq_id is null));

  if conv_id is null then
    insert into public.conversations (buyer_id, company_id, equipment_id)
    values (auth.uid(), comp_id, eq_id)
    returning id into conv_id;
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (conv_id, auth.uid(), first_message);

  return conv_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.start_conversation(uuid, uuid, text) to authenticated;

-- ---------- equipment view counter ----------
alter table public.equipment add column views int not null default 0;

create function public.increment_equipment_views(eq_id uuid)
returns void as $$
  update public.equipment set views = views + 1 where id = eq_id;
$$ language sql security definer set search_path = public;

grant execute on function public.increment_equipment_views(uuid) to anon, authenticated;
