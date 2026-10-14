import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

// Vídeo decorativo em loop atrás da busca da home (empresas anunciando e negociando itens).
// Gerado em Remotion (projeto local instagram-videos, src/hero/HeroNegociacao.tsx). Só carrega
// em telas a partir de 640px e quando o usuário não pediu redução de movimento.
const QUERY = "(min-width: 640px) and (prefers-reduced-motion: no-preference)";
// Troque ao substituir os arquivos em public/videos para o navegador não usar a versão em cache.
const VERSION = "3";

export function HeroBackgroundVideo() {
  const { theme } = useTheme();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!enabled) return null;

  return (
    <video
      key={theme}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      poster={`/videos/hero-negociacao-${theme}.jpg?v=${VERSION}`}
      aria-hidden
    >
      <source src={`/videos/hero-negociacao-${theme}.mp4?v=${VERSION}`} type="video/mp4" />
    </video>
  );
}
