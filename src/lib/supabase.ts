import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

export type Profile = {
  id: string;
  role: "user" | "company" | "admin";
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

export type CompanyStatus = "pending" | "approved" | "rejected";

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  site: string | null;
  description: string | null;
  services: string[];
  status: CompanyStatus;
  verified: boolean;
  years_on_market: number;
  rating: number;
  reviews: number;
  logo_path: string | null;
  banner_path: string | null;
  created_at: string;
};

export type Category = {
  slug: string;
  name: string;
  count: number;
};

export type EquipmentRow = {
  id: string;
  company_id: string;
  slug: string;
  title: string;
  brand: string | null;
  model: string | null;
  category_slug: string | null;
  price: number;
  mode: "venda" | "locacao";
  rental_period: "dia" | "semana" | "mes" | null;
  condition: "Novo" | "Seminovo" | "Usado";
  year: number | null;
  hours: number;
  city: string | null;
  state: string | null;
  image_key: string | null;
  description: string | null;
  specs: { label: string; value: string }[];
  compatible_with: string[];
  images: string[];
  status: "active" | "paused" | "removed";
  views: number;
  created_at: string;
  companies?: Company;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: "mensagem" | "empresa_aprovada" | "empresa_rejeitada" | "novo_lead";
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  equipment_id: string | null;
  buyer_id: string;
  company_id: string;
  last_message_at: string;
  created_at: string;
  companies?: Company;
  buyer?: Profile;
  equipment?: EquipmentRow;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Review = {
  id: string;
  company_id: string;
  author_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
};

export type CompanyAnalyticsDay = {
  day: string;
  views: number;
  contact_unlocks: number;
  messages: number;
  favorites: number;
};
