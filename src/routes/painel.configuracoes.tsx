import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/painel/configuracoes")({
  component: PainelConfiguracoes,
});

function PainelConfiguracoes() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="text-muted-foreground">Gerencie os dados da sua empresa.</p>

      <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <BadgeCheck className="h-4 w-4" /> Empresa verificada
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome da empresa</Label>
            <Input defaultValue="TecnoMáquinas Engenharia" />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input defaultValue="12.345.678/0001-90" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" defaultValue="contato@tecnomaquinas.com.br" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input defaultValue="(11) 3555-1200" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea rows={4} defaultValue="Especialistas em locação e venda de máquinas pesadas para grandes obras de infraestrutura." />
        </div>
        <div className="flex justify-end">
          <Button>Salvar alterações</Button>
        </div>
      </div>
    </div>
  );
}
