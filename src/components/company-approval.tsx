import { Link } from "@tanstack/react-router";
import { Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportContact } from "@/components/support-contact";

export function CompanyApproval({
  status,
  companyName,
  onRefresh,
  refreshing = false,
}: {
  status: "pending" | "rejected";
  companyName?: string;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  const pending = status === "pending";
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center">
      {pending ? (
        <Clock className="h-10 w-10 text-accent" />
      ) : (
        <ShieldAlert className="h-10 w-10 text-destructive" />
      )}
      <h1 className="text-xl font-bold">
        {pending ? "Cadastro em análise" : "Cadastro não aprovado"}
      </h1>
      <p className="max-w-md text-muted-foreground">
        {pending
          ? `${companyName || "Sua empresa"} está aguardando análise. Quando aprovada, você poderá publicar o primeiro anúncio. A decisão aparece nas suas notificações.`
          : "A publicação está indisponível porque o cadastro não foi aprovado. Fale com o suporte para entender o motivo e os próximos passos."}
      </p>
      {pending && (
        <p className="max-w-md text-sm text-muted-foreground">
          Enquanto isso, separe fotos reais e as especificações do item que deseja anunciar.
          Consulte o suporte sobre o andamento e o prazo da análise.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Atualizando..." : "Atualizar status"}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/notificacoes">Ver notificações</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/configuracoes">Revisar dados</Link>
        </Button>
      </div>
      <SupportContact />
    </div>
  );
}
