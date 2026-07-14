import {
  supabase,
  type Category,
  type Company,
  type ConversationRow,
  type EquipmentRow,
  type MessageRow,
  type NotificationRow,
} from "@/lib/supabase";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories_with_counts").select("*").order("name");
  if (error) throw error;
  return data;
}

export type EquipmentFilters = {
  q?: string;
  categorias?: string[];
  modos?: string[];
  condicoes?: string[];
  marca?: string;
  estado?: string;
  minPrice?: number;
  maxPrice?: number;
};

export async function fetchEquipmentList(filters: EquipmentFilters = {}): Promise<EquipmentRow[]> {
  let query = supabase
    .from("equipment")
    .select("*, companies(*)")
    .eq("status", "active");

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.categorias?.length) query = query.in("category_slug", filters.categorias);
  if (filters.modos?.length) query = query.in("mode", filters.modos);
  if (filters.condicoes?.length) query = query.in("condition", filters.condicoes);
  if (filters.marca && filters.marca !== "todas") query = query.eq("brand", filters.marca);
  if (filters.estado && filters.estado !== "todos") query = query.eq("state", filters.estado);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as EquipmentRow[];
}

export async function fetchEquipmentBySlug(slug: string): Promise<EquipmentRow | null> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*, companies(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as EquipmentRow | null;
}

export async function fetchRelatedEquipment(categorySlug: string, excludeId: string): Promise<EquipmentRow[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*, companies(*)")
    .eq("category_slug", categorySlug)
    .eq("status", "active")
    .neq("id", excludeId)
    .limit(4);
  if (error) throw error;
  return data as EquipmentRow[];
}

export async function fetchApprovedCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("status", "approved")
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchCompanyBySlug(slug: string): Promise<Company | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchCompanyEquipment(companyId: string): Promise<EquipmentRow[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*, companies(*)")
    .eq("company_id", companyId)
    .eq("status", "active");
  if (error) throw error;
  return data as EquipmentRow[];
}

export async function fetchMyCompany(ownerId: string): Promise<Company | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("owner_id", ownerId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyEquipment(companyId: string): Promise<EquipmentRow[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*, companies(*)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as EquipmentRow[];
}

export async function createEquipment(payload: {
  company_id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  category_slug: string;
  price: number;
  mode: "venda" | "locacao";
  condition: "Novo" | "Seminovo" | "Usado";
  year: number;
  city: string;
  state: string;
  description: string;
  image_key: string | null;
  images: string[];
  specs: { label: string; value: string }[];
}) {
  const { error } = await supabase.from("equipment").insert(payload);
  if (error) throw error;
}

export async function deleteEquipment(id: string) {
  const { error } = await supabase.from("equipment").delete().eq("id", id);
  if (error) throw error;
}

export async function createCompany(payload: {
  owner_id: string;
  name: string;
  slug: string;
  cnpj: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  description: string;
}) {
  const { error } = await supabase.from("companies").insert(payload);
  if (error) throw error;
}

export async function fetchAllCompaniesAdmin(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function setCompanyStatus(id: string, status: "approved" | "rejected") {
  const { error } = await supabase.from("companies").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function unlockEquipmentContact(equipmentId: string): Promise<{ phone: string; whatsapp: string }> {
  const { data, error } = await supabase.rpc("unlock_equipment_contact", { eq_id: equipmentId });
  if (error) throw error;
  return data[0];
}

export async function unlockCompanyContact(
  companyId: string,
): Promise<{ phone: string; whatsapp: string; site: string }> {
  const { data, error } = await supabase.rpc("unlock_company_contact", { comp_id: companyId });
  if (error) throw error;
  return data[0];
}

export async function updateProfile(id: string, patch: Partial<{ full_name: string; phone: string }>) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateCompany(
  id: string,
  patch: Partial<{
    name: string;
    cnpj: string;
    city: string;
    state: string;
    phone: string;
    whatsapp: string;
    site: string;
    description: string;
  }>,
) {
  const { error } = await supabase.from("companies").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateEquipment(
  id: string,
  patch: Partial<{
    title: string;
    brand: string;
    model: string;
    category_slug: string;
    price: number;
    mode: "venda" | "locacao";
    condition: "Novo" | "Seminovo" | "Usado";
    year: number;
    city: string;
    state: string;
    description: string;
    status: "active" | "paused" | "removed";
    specs: { label: string; value: string }[];
  }>,
) {
  const { error } = await supabase.from("equipment").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchEquipmentById(id: string): Promise<EquipmentRow | null> {
  const { data, error } = await supabase.from("equipment").select("*, companies(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as EquipmentRow | null;
}

export async function incrementEquipmentViews(id: string) {
  const { error } = await supabase.rpc("increment_equipment_views", { eq_id: id });
  if (error) throw error;
}

// ---------- favorites ----------

export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("favorites").select("equipment_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((f) => f.equipment_id));
}

export async function fetchFavoriteEquipment(userId: string): Promise<EquipmentRow[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("equipment:equipment_id(*, companies(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((f) => f.equipment).filter(Boolean) as unknown as EquipmentRow[];
}

export async function addFavorite(userId: string, equipmentId: string) {
  const { error } = await supabase.from("favorites").insert({ user_id: userId, equipment_id: equipmentId });
  if (error) throw error;
}

export async function countCompanyFavorites(companyId: string): Promise<number> {
  const { data, error } = await supabase.rpc("count_company_favorites", { comp_id: companyId });
  if (error) throw error;
  return data as number;
}

export async function removeFavorite(userId: string, equipmentId: string) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("equipment_id", equipmentId);
  if (error) throw error;
}

// ---------- notifications ----------

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
}

// ---------- messaging ----------

export async function fetchConversations(userId: string): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, companies(*), buyer:buyer_id(*), equipment:equipment_id(*)")
    .or(`buyer_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) throw error;

  const { data: asOwner, error: error2 } = await supabase
    .from("conversations")
    .select("*, companies!inner(*), buyer:buyer_id(*), equipment:equipment_id(*)")
    .eq("companies.owner_id", userId)
    .order("last_message_at", { ascending: false });
  if (error2) throw error2;

  const merged = [...(data ?? []), ...(asOwner ?? [])];
  const byId = new Map(merged.map((c) => [c.id, c]));
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
  ) as unknown as ConversationRow[];
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
}

export async function startConversation(companyId: string, equipmentId: string | null, firstMessage: string) {
  const { data, error } = await supabase.rpc("start_conversation", {
    comp_id: companyId,
    eq_id: equipmentId,
    first_message: firstMessage,
  });
  if (error) throw error;
  return data as string;
}
