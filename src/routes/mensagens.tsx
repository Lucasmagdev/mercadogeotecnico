import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Phone, Search, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { conversations } from "@/lib/mock-data";

export const Route = createFileRoute("/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens — EngiMercado" },
      { name: "description", content: "Converse com compradores e vendedores em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Mensagens,
});

function Mensagens() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const active = conversations.find((c) => c.id === activeId)!;

  return (
    <div className="container-page py-8">
      <h1 className="mb-4 text-2xl font-bold">Mensagens</h1>
      <div className="grid h-[70vh] overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="hidden flex-col border-r border-border md:flex">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conversa..." className="pl-10" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full gap-3 border-b border-border p-3 text-left transition-colors hover:bg-muted/50 ${
                  activeId === c.id ? "bg-muted/70" : ""
                }`}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">{c.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-secondary text-secondary-foreground">{active.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold">{active.name}</p>
                  <BadgeCheck className="h-3.5 w-3.5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">{active.company}</p>
              </div>
            </div>
            <Button variant="outline" size="icon" aria-label="Ligar"><Phone className="h-4 w-4" /></Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
            {active.messages.map((m, i) => (
              <div key={i} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    m.fromMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border border-border"
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`mt-1 text-right text-[10px] ${m.fromMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input placeholder="Digite sua mensagem..." className="flex-1" />
            <Button size="icon" aria-label="Enviar"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
