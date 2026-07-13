import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Users, Heart, FileText, BadgeCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifications, type Notification } from "@/lib/mock-data";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — EngiMercado" },
      { name: "description", content: "Acompanhe propostas, mensagens e atualizações dos seus anúncios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Notificacoes,
});

const iconMap: Record<Notification["type"], typeof Bell> = {
  mensagem: MessageSquare,
  interessado: Users,
  favorito: Heart,
  proposta: FileText,
  aviso: BadgeCheck,
};

function Notificacoes() {
  return (
    <div className="container-page max-w-2xl py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificações</h1>
        <Button variant="ghost" size="sm">Marcar todas como lidas</Button>
      </div>

      <div className="mt-6 space-y-2">
        {notifications.map((n) => {
          const Icon = iconMap[n.type];
          return (
            <div
              key={n.id}
              className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
                n.unread ? "border-primary/30 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{n.title}</p>
                  {n.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
