import { Mail, MessageCircle } from "lucide-react";
import { support } from "@/lib/support";

export function SupportContact() {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">Precisa de ajuda? Fale com {support.name}.</p>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <a
          href={`https://wa.me/${support.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp {support.whatsappLabel}
        </a>
        <a
          href={`mailto:${support.email}`}
          className="inline-flex min-w-0 items-center gap-1.5 break-all text-primary hover:underline"
        >
          <Mail className="h-4 w-4 shrink-0" /> {support.email}
        </a>
      </div>
    </div>
  );
}
