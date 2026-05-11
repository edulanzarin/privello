import Link from "next/link";
import { Eye } from "lucide-react";

type Props = {
  variant: "own-profile" | "other-profile" | "search";
  profileSlug?: string;
};

export function ProviderBanner({ variant, profileSlug }: Props) {
  if (variant === "own-profile") {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-coral/20 bg-coral/5 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-coral">
          <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>Você está visualizando seu próprio perfil — visualizações não são contadas.</span>
        </div>
        <Link href="/painel" className="shrink-0 text-xs font-semibold text-coral underline underline-offset-2">
          Ir ao painel
        </Link>
      </div>
    );
  }

  if (variant === "other-profile") {
    return (
      <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-2.5 text-xs text-muted">
        <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span>Você está navegando como acompanhante — visualizações, curtidas e contato não estão disponíveis neste modo.</span>
      </div>
    );
  }

  if (variant === "search") {
    return (
      <div className="flex items-center gap-2 border border-line bg-white px-4 py-2.5 text-xs text-muted">
        <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span>Você está navegando como acompanhante. Visualizações de outros perfis não são contadas.</span>
      </div>
    );
  }

  return null;
}
