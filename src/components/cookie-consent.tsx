import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept(value: "all" | "essential") {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-[60] px-4 pb-3 md:bottom-0 md:pb-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-popover p-4 shadow-lift sm:flex-row sm:items-center">
        <Cookie className="hidden h-6 w-6 shrink-0 text-accent sm:block" />
        <p className="flex-1 text-sm text-muted-foreground">
          Usamos cookies para melhorar sua experiência e analisar o uso da plataforma, conforme
          nossa{" "}
          <Link to="/privacidade" className="font-medium text-primary hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => accept("essential")}>
            Apenas essenciais
          </Button>
          <Button size="sm" onClick={() => accept("all")}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
