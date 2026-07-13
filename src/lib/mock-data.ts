import excavator from "@/assets/equip-excavator.jpg";
import crane from "@/assets/equip-crane.jpg";
import generator from "@/assets/equip-generator.jpg";
import bobcat from "@/assets/equip-bobcat.jpg";

export const equipmentImages = { excavator, crane, generator, bobcat };

export type Category = {
  slug: string;
  name: string;
  count: number;
};

export const categories: Category[] = [
  { slug: "maquinas-pesadas", name: "Máquinas Pesadas", count: 1284 },
  { slug: "bobcat", name: "Bobcat", count: 312 },
  { slug: "escavadeiras", name: "Escavadeiras", count: 894 },
  { slug: "retroescavadeiras", name: "Retroescavadeiras", count: 476 },
  { slug: "perfuratrizes", name: "Perfuratrizes", count: 143 },
  { slug: "guindastes", name: "Guindastes", count: 208 },
  { slug: "geradores", name: "Geradores", count: 561 },
  { slug: "motores", name: "Motores", count: 389 },
  { slug: "equipamentos-hidraulicos", name: "Equipamentos Hidráulicos", count: 267 },
  { slug: "trados", name: "Trados", count: 98 },
  { slug: "pecas", name: "Peças", count: 2140 },
  { slug: "ferramentas", name: "Ferramentas", count: 1732 },
  { slug: "equipamentos-fundacao", name: "Equipamentos de Fundação", count: 176 },
  { slug: "equipamentos-sondagem", name: "Equipamentos de Sondagem", count: 121 },
  { slug: "equipamentos-laboratorio", name: "Equipamentos de Laboratório", count: 89 },
  { slug: "servicos", name: "Serviços", count: 640 },
];

export type Company = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  verified: boolean;
  yearsOnMarket: number;
  rating: number;
  reviews: number;
  description: string;
  phone: string;
  whatsapp: string;
  site: string;
  services: string[];
};

export const companies: Company[] = [
  {
    id: "c1",
    name: "TecnoMáquinas Engenharia",
    slug: "tecnomaquinas",
    city: "São Paulo",
    state: "SP",
    verified: true,
    yearsOnMarket: 18,
    rating: 4.9,
    reviews: 312,
    description:
      "Especialistas em locação e venda de máquinas pesadas para grandes obras de infraestrutura. Frota própria e manutenção certificada.",
    phone: "(11) 3555-1200",
    whatsapp: "5511999990000",
    site: "www.tecnomaquinas.com.br",
    services: ["Locação de máquinas", "Manutenção preventiva", "Transporte especializado"],
  },
  {
    id: "c2",
    name: "Norte Equipamentos",
    slug: "norte-equipamentos",
    city: "Belo Horizonte",
    state: "MG",
    verified: true,
    yearsOnMarket: 11,
    rating: 4.7,
    reviews: 154,
    description:
      "Distribuidora de equipamentos de fundação e sondagem com atuação nacional e assistência técnica em campo.",
    phone: "(31) 3222-8080",
    whatsapp: "5531988887777",
    site: "www.norteequipamentos.com.br",
    services: ["Sondagem", "Fundações", "Consultoria técnica"],
  },
  {
    id: "c3",
    name: "PowerGen Energia",
    slug: "powergen",
    city: "Curitiba",
    state: "PR",
    verified: false,
    yearsOnMarket: 6,
    rating: 4.5,
    reviews: 87,
    description:
      "Soluções em geração de energia: geradores, motores e sistemas de backup para canteiros e indústrias.",
    phone: "(41) 3010-4545",
    whatsapp: "5541977776666",
    site: "www.powergen.com.br",
    services: ["Locação de geradores", "Instalação", "Manutenção 24h"],
  },
  {
    id: "c4",
    name: "Atlas Construção Pesada",
    slug: "atlas",
    city: "Rio de Janeiro",
    state: "RJ",
    verified: true,
    yearsOnMarket: 24,
    rating: 4.8,
    reviews: 421,
    description:
      "Referência em guindastes e içamento de cargas. Operadores certificados e planos de rigging completos.",
    phone: "(21) 2555-3030",
    whatsapp: "5521966665555",
    site: "www.atlaspesada.com.br",
    services: ["Içamento de cargas", "Guindastes", "Planos de rigging"],
  },
];

export type Equipment = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  mode: "venda" | "locacao";
  condition: "Novo" | "Seminovo" | "Usado";
  year: number;
  hours: number;
  city: string;
  state: string;
  image: keyof typeof equipmentImages;
  companyId: string;
  description: string;
  specs: { label: string; value: string }[];
};

export const equipment: Equipment[] = [
  {
    id: "e1",
    slug: "escavadeira-cat-320",
    title: "Escavadeira Hidráulica CAT 320",
    brand: "Caterpillar",
    model: "320 GC",
    category: "escavadeiras",
    price: 685000,
    mode: "venda",
    condition: "Seminovo",
    year: 2021,
    hours: 3200,
    city: "São Paulo",
    state: "SP",
    image: "excavator",
    companyId: "c1",
    description:
      "Escavadeira hidráulica de esteira com excelente estado de conservação, revisada e pronta para operação. Ideal para terraplenagem e obras de grande porte.",
    specs: [
      { label: "Peso operacional", value: "22.900 kg" },
      { label: "Potência", value: "122 HP" },
      { label: "Capacidade da caçamba", value: "1,19 m³" },
      { label: "Profundidade de escavação", value: "6.720 mm" },
    ],
  },
  {
    id: "e2",
    slug: "guindaste-tadano-25t",
    title: "Guindaste Hidráulico 25 Toneladas",
    brand: "Tadano",
    model: "GR-250XL",
    category: "guindastes",
    price: 4200,
    mode: "locacao",
    condition: "Usado",
    year: 2018,
    hours: 8600,
    city: "Rio de Janeiro",
    state: "RJ",
    image: "crane",
    companyId: "c4",
    description:
      "Guindaste sobre caminhão para içamento de cargas médias. Disponível para locação com ou sem operador certificado.",
    specs: [
      { label: "Capacidade máxima", value: "25 t" },
      { label: "Lança principal", value: "30,5 m" },
      { label: "Alcance máximo", value: "34 m" },
      { label: "Tração", value: "4x4" },
    ],
  },
  {
    id: "e3",
    slug: "gerador-diesel-250kva",
    title: "Gerador a Diesel 250 kVA",
    brand: "Cummins",
    model: "C250D5",
    category: "geradores",
    price: 132000,
    mode: "venda",
    condition: "Novo",
    year: 2024,
    hours: 0,
    city: "Curitiba",
    state: "PR",
    image: "generator",
    companyId: "c3",
    description:
      "Grupo gerador silenciado com painel automático e QTA. Ideal para indústrias, hospitais e canteiros de obra.",
    specs: [
      { label: "Potência standby", value: "250 kVA" },
      { label: "Tensão", value: "220/380 V" },
      { label: "Consumo (75%)", value: "38 L/h" },
      { label: "Nível de ruído", value: "72 dB(A)" },
    ],
  },
  {
    id: "e4",
    slug: "bobcat-s70",
    title: "Mini Carregadeira Bobcat S70",
    brand: "Bobcat",
    model: "S70",
    category: "bobcat",
    price: 2800,
    mode: "locacao",
    condition: "Seminovo",
    year: 2022,
    hours: 1450,
    city: "Belo Horizonte",
    state: "MG",
    image: "bobcat",
    companyId: "c2",
    description:
      "Mini carregadeira compacta ideal para espaços reduzidos, reformas e obras urbanas. Baixo consumo e alta manobrabilidade.",
    specs: [
      { label: "Capacidade operacional", value: "445 kg" },
      { label: "Potência", value: "23,5 HP" },
      { label: "Largura", value: "914 mm" },
      { label: "Altura de descarga", value: "2.007 mm" },
    ],
  },
  {
    id: "e5",
    slug: "escavadeira-komatsu-pc200",
    title: "Escavadeira Komatsu PC200",
    brand: "Komatsu",
    model: "PC200-8",
    category: "escavadeiras",
    price: 520000,
    mode: "venda",
    condition: "Usado",
    year: 2017,
    hours: 9800,
    city: "São Paulo",
    state: "SP",
    image: "excavator",
    companyId: "c1",
    description:
      "Escavadeira robusta e confiável, ótima relação custo-benefício. Manutenções em dia com histórico completo.",
    specs: [
      { label: "Peso operacional", value: "20.000 kg" },
      { label: "Potência", value: "148 HP" },
      { label: "Capacidade da caçamba", value: "0,80 m³" },
      { label: "Profundidade de escavação", value: "6.620 mm" },
    ],
  },
  {
    id: "e6",
    slug: "gerador-stemac-150kva",
    title: "Gerador Stemac 150 kVA",
    brand: "Stemac",
    model: "ST150",
    category: "geradores",
    price: 1900,
    mode: "locacao",
    condition: "Seminovo",
    year: 2020,
    hours: 2100,
    city: "Curitiba",
    state: "PR",
    image: "generator",
    companyId: "c3",
    description:
      "Gerador silenciado para eventos e obras. Locação com combustível opcional e suporte 24h.",
    specs: [
      { label: "Potência standby", value: "150 kVA" },
      { label: "Tensão", value: "220/380 V" },
      { label: "Consumo (75%)", value: "24 L/h" },
      { label: "Autonomia tanque", value: "10 h" },
    ],
  },
  {
    id: "e7",
    slug: "guindaste-liebherr-40t",
    title: "Guindaste Liebherr 40 Toneladas",
    brand: "Liebherr",
    model: "LTM 1040",
    category: "guindastes",
    price: 890000,
    mode: "venda",
    condition: "Usado",
    year: 2015,
    hours: 12400,
    city: "Rio de Janeiro",
    state: "RJ",
    image: "crane",
    companyId: "c4",
    description:
      "Guindaste móvel de alta capacidade para montagens industriais e içamentos de grande porte.",
    specs: [
      { label: "Capacidade máxima", value: "40 t" },
      { label: "Lança telescópica", value: "35 m" },
      { label: "Jib", value: "16 m" },
      { label: "Eixos", value: "3" },
    ],
  },
  {
    id: "e8",
    slug: "bobcat-t595",
    title: "Bobcat Esteira T595",
    brand: "Bobcat",
    model: "T595",
    category: "bobcat",
    price: 3400,
    mode: "locacao",
    condition: "Novo",
    year: 2024,
    hours: 120,
    city: "Belo Horizonte",
    state: "MG",
    image: "bobcat",
    companyId: "c2",
    description:
      "Mini carregadeira de esteira com alta tração, ideal para terrenos acidentados e obras de infraestrutura.",
    specs: [
      { label: "Capacidade operacional", value: "998 kg" },
      { label: "Potência", value: "66 HP" },
      { label: "Largura", value: "1.676 mm" },
      { label: "Velocidade", value: "11,4 km/h" },
    ],
  },
];

export function getCompany(id: string) {
  return companies.find((c) => c.id === id);
}

export function getEquipment(slug: string) {
  return equipment.find((e) => e.slug === slug);
}

export const brands = ["Caterpillar", "Komatsu", "Tadano", "Liebherr", "Bobcat", "Cummins", "Stemac"];
export const states = ["SP", "RJ", "MG", "PR", "RS", "SC", "BA", "GO"];

export function formatPrice(value: number, mode: "venda" | "locacao") {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
  return mode === "locacao" ? `${formatted}/dia` : formatted;
}

export type Conversation = {
  id: string;
  name: string;
  company: string;
  online: boolean;
  unread: number;
  last: string;
  time: string;
  messages: { fromMe: boolean; text: string; time: string }[];
};

export const conversations: Conversation[] = [
  {
    id: "conv1",
    name: "Carlos Menezes",
    company: "Atlas Construção Pesada",
    online: true,
    unread: 2,
    last: "Podemos fechar a locação para segunda-feira?",
    time: "09:42",
    messages: [
      { fromMe: false, text: "Bom dia! Vi o anúncio do guindaste de 25t.", time: "09:30" },
      { fromMe: true, text: "Bom dia, Carlos! Ele está disponível sim.", time: "09:34" },
      { fromMe: false, text: "Qual o valor da diária com operador?", time: "09:38" },
      { fromMe: true, text: "R$ 4.200/dia com operador certificado incluso.", time: "09:40" },
      { fromMe: false, text: "Podemos fechar a locação para segunda-feira?", time: "09:42" },
    ],
  },
  {
    id: "conv2",
    name: "Ana Ribeiro",
    company: "Norte Equipamentos",
    online: false,
    unread: 0,
    last: "Enviei a proposta em PDF, dá uma olhada.",
    time: "Ontem",
    messages: [
      { fromMe: false, text: "Olá! Tenho interesse na escavadeira PC200.", time: "14:10" },
      { fromMe: true, text: "Oi Ana! Posso te enviar mais fotos e o laudo.", time: "14:20" },
      { fromMe: false, text: "Enviei a proposta em PDF, dá uma olhada.", time: "14:45" },
    ],
  },
  {
    id: "conv3",
    name: "Marcelo Souza",
    company: "PowerGen Energia",
    online: true,
    unread: 1,
    last: "O gerador de 250kVA ainda está disponível?",
    time: "Ter",
    messages: [
      { fromMe: false, text: "O gerador de 250kVA ainda está disponível?", time: "11:05" },
    ],
  },
];

export type Notification = {
  id: string;
  type: "mensagem" | "interessado" | "favorito" | "proposta" | "aviso";
  title: string;
  desc: string;
  time: string;
  unread: boolean;
};

export const notifications: Notification[] = [
  { id: "n1", type: "proposta", title: "Nova proposta recebida", desc: "Atlas Construção enviou uma proposta para o Guindaste 25t.", time: "há 12 min", unread: true },
  { id: "n2", type: "mensagem", title: "Nova mensagem", desc: "Carlos Menezes: Podemos fechar para segunda?", time: "há 1 h", unread: true },
  { id: "n3", type: "interessado", title: "Novo interessado", desc: "3 empresas visualizaram sua Escavadeira CAT 320.", time: "há 3 h", unread: true },
  { id: "n4", type: "favorito", title: "Seu anúncio foi favoritado", desc: "O Gerador 250 kVA foi salvo por 5 empresas.", time: "ontem", unread: false },
  { id: "n5", type: "aviso", title: "Selo de empresa verificada", desc: "Parabéns! Sua empresa foi verificada com sucesso.", time: "há 2 dias", unread: false },
];
