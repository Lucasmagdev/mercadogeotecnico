import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-provider";
import { fetchConversations, fetchMyCompany } from "@/lib/queries";

export const Route = createFileRoute("/painel/pedidos")({
  component: PainelPedidos,
});

function PainelPedidos() {
  const { session } = useAuth();
  const { data: company } = useQuery({
    queryKey: ["my-company", session?.user.id],
    queryFn: () => fetchMyCompany(session!.user.id),
    enabled: !!session,
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", session?.user.id],
    queryFn: () => fetchConversations(session!.user.id),
    enabled: !!session,
  });

  const leads = conversations.filter((c) => c.company_id === company?.id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <p className="text-muted-foreground">Interessados que entraram em contato pelos seus anúncios.</p>

      <div className="mt-6 space-y-3">
        {leads.map((c) => (
          <Link
            key={c.id}
            to="/mensagens"
            search={{ c: c.id }}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {(c.buyer?.full_name ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.buyer?.full_name ?? "Usuário"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {c.equipment ? `Sobre: ${c.equipment.title}` : "Contato geral"}
              </p>
            </div>
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
        {leads.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum pedido de contato ainda.</p>
        )}
      </div>
    </div>
  );
}
