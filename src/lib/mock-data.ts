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

export const brands = [
  "Caterpillar",
  "Komatsu",
  "Tadano",
  "Liebherr",
  "Bobcat",
  "Cummins",
  "Stemac",
];
export const states = ["SP", "RJ", "MG", "PR", "RS", "SC", "BA", "GO"];

export function formatPrice(value: number, mode: "venda" | "locacao") {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
  return mode === "locacao" ? `${formatted}/dia` : formatted;
}
