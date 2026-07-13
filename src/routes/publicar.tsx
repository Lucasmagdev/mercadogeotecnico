import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { categories, brands, states } from "@/lib/mock-data";

export const Route = createFileRoute("/publicar")({
  head: () => ({
    meta: [
      { title: "Anunciar equipamento — EngiMercado" },
      { name: "description", content: "Publique seu equipamento, peça ou serviço de engenharia em poucos passos." },
    ],
  }),
  component: Publicar,
});

const steps = ["Categoria", "Detalhes", "Preço & Local", "Fotos", "Revisão"];

function Publicar() {
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Anunciar equipamento</h1>
      <p className="mt-1 text-muted-foreground">Preencha as informações para publicar seu anúncio.</p>

      {/* Steps */}
      <div className="mt-8 flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < step
                  ? "bg-success text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="mt-1.5 hidden text-xs text-muted-foreground sm:block">{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-8 rounded-2xl border border-border bg-card p-6"
      >
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Qual a categoria?</h2>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {categories.slice(0, 9).map((c) => (
                <button
                  key={c.slug}
                  className="rounded-xl border border-border p-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Detalhes do equipamento</h2>
            <div className="space-y-2">
              <Label>Título do anúncio</Label>
              <Input placeholder="Ex: Escavadeira Hidráulica CAT 320" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input placeholder="Ex: 320 GC" />
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input type="number" placeholder="2021" />
              </div>
              <div className="space-y-2">
                <Label>Condição</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Seminovo">Seminovo</SelectItem>
                    <SelectItem value="Usado">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea rows={4} placeholder="Descreva o estado, histórico de manutenção e diferenciais." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Preço e localização</h2>
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <RadioGroup defaultValue="venda" className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="venda" /> Venda</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="locacao" /> Locação</label>
              </RadioGroup>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label>Valor (R$)</Label>
                <Input type="number" placeholder="685000" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input placeholder="São Paulo" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Fotos do equipamento</h2>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Arraste as fotos aqui</p>
              <p className="text-sm text-muted-foreground">ou clique para selecionar (até 12 imagens)</p>
              <Button variant="outline" className="mt-4">Selecionar arquivos</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <Sparkles className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-lg font-semibold">Tudo pronto!</h2>
            <p className="text-muted-foreground">Revise as informações e publique seu anúncio para milhares de empresas.</p>
            <Button size="lg" className="mt-2">Publicar anúncio</Button>
          </div>
        )}
      </motion.div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} className="gap-1">
          Continuar <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
