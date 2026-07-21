import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Search, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { useRealtimeMessages } from "@/hooks/use-realtime";
import { fetchConversations, fetchMessages, sendMessage } from "@/lib/queries";

type Search = { c?: string };

export const Route = createFileRoute("/mensagens")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mensagens — Mercado Geotécnico" },
      { name: "description", content: "Converse com compradores e vendedores em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Mensagens,
});

function Mensagens() {
  const { session, loading } = useAuth();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | undefined>(search.c);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");

  useRealtimeMessages(session?.user.id);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", session?.user.id],
    queryFn: () => fetchConversations(session!.user.id),
    enabled: !!session,
    // Realtime invalidates on new messages; this is just a safety net.
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const active = conversations.find((c) => c.id === activeId);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => fetchMessages(activeId!),
    enabled: !!activeId,
    refetchInterval: 60000,
  });

  const send = useMutation({
    mutationFn: () => sendMessage(activeId!, session!.user.id, draft.trim()),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", session?.user.id] });
    },
    onError: () => toast.error("Não foi possível enviar a mensagem. Tente novamente."),
  });

  if (loading) {
    return (
      <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Entre para ver suas mensagens</h1>
        <Button asChild>
          <Link to="/entrar">Entrar</Link>
        </Button>
      </div>
    );
  }

  const filtered = conversations.filter((c) => {
    const name = c.buyer_id === session.user.id ? c.companies?.name : c.buyer?.full_name;
    return !q || (name ?? "").toLowerCase().includes(q.toLowerCase());
  });

  function counterpartName(c: NonNullable<typeof active>) {
    return c.buyer_id === session!.user.id ? c.companies?.name : (c.buyer?.full_name ?? "Usuário");
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-4 text-2xl font-bold">Mensagens</h1>
      <div className="grid h-[70vh] overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="hidden flex-col border-r border-border md:flex">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                className="pl-10"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const name = counterpartName(c);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full gap-3 border-b border-border p-3 text-left transition-colors hover:bg-muted/50 ${
                    activeId === c.id ? "bg-muted/70" : ""
                  }`}
                >
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {(name ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold">{name}</p>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.equipment ? c.equipment.title : "Contato geral"}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {(counterpartName(active) ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{counterpartName(active)}</p>
                    {active.equipment && (
                      <Link
                        to="/equipamentos/$slug"
                        params={{ slug: active.equipment.slug }}
                        className="text-xs text-muted-foreground hover:text-primary hover:underline"
                      >
                        {active.equipment.title}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_id === session.user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        m.sender_id === session.user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground border border-border"
                      }`}
                    >
                      <p>{m.body}</p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          m.sender_id === session.user.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Nenhuma mensagem ainda.
                  </p>
                )}
              </div>

              <form
                className="flex items-center gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) send.mutate();
                }}
              >
                <Input
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Enviar"
                  disabled={send.isPending || !draft.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
