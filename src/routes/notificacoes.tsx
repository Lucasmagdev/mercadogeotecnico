import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, CheckCircle2, XCircle, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/queries";
import type { NotificationRow } from "@/lib/supabase";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Mercado Geotécnico" },
      { name: "description", content: "Acompanhe propostas, mensagens e atualizações dos seus anúncios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Notificacoes,
});

const iconMap: Record<NotificationRow["type"], typeof Bell> = {
  mensagem: MessageSquare,
  empresa_aprovada: CheckCircle2,
  empresa_rejeitada: XCircle,
  novo_lead: Users,
};

function Notificacoes() {
  const { session, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", session?.user.id],
    queryFn: () => fetchNotifications(session!.user.id),
    enabled: !!session,
    refetchInterval: 8000,
  });

  const markRead = useMutation({
    mutationFn: () => markAllNotificationsRead(session!.user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", session?.user.id] }),
  });

  if (loading) {
    return <div className="container-page py-16 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Bell className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Entre para ver suas notificações</h1>
        <Button asChild><Link to="/entrar">Entrar</Link></Button>
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="container-page max-w-2xl py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificações</h1>
        <Button variant="ghost" size="sm" disabled={!hasUnread || markRead.isPending} onClick={() => markRead.mutate()}>
          Marcar todas como lidas
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {notifications.map((n) => {
          const Icon = iconMap[n.type];
          const content = (
            <div
              className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
                n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          );
          return n.link ? (
            <Link key={n.id} to={n.link as "/painel" | "/mensagens"} className="block">{content}</Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
        {notifications.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
        )}
      </div>
    </div>
  );
}
