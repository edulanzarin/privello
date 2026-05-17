"use client";

import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/_actions/favorites";
import { useOptimisticToggle } from "@/lib/hooks/use-optimistic-toggle";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Props = {
  profileId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  className?: string;
};

/**
 * FavoriteButton — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/profile/favorite-button.tsx
 * Steering: `.kiro/steering/design-system.md` §6.3.
 *
 * Toggle otimista de favorito; visual segue o padrão dos secondary CTAs:
 *  - Estado on (favoritado): `bg-rose text-white` (igual ao Button primary).
 *  - Estado off: `bg-white border border-line text-ink` (igual ao secondary).
 *  - Heart preenche quando favoritado.
 *
 * Props:
 * - `profileId` (string): id do perfil-alvo.
 * - `initialFavorited` (boolean): estado inicial vindo do servidor.
 * - `isLoggedIn` (boolean): se falso, redireciona para `/entrar?callbackUrl=...`.
 * - `className?` (string): classes Tailwind extras.
 *
 * Side effects:
 * - Server action `toggleFavorite(profileId)`.
 * - `useOptimisticToggle` aplica/rollback.
 * - Toast de erro via `useToast`.
 * - Redirect via `window.location.href` quando não autenticado.
 */
export function FavoriteButton({
  profileId,
  initialFavorited,
  isLoggedIn,
  className: extraClass,
}: Props) {
  const { toast } = useToast();
  const { value: favorited, toggle, pending } = useOptimisticToggle<boolean>({
    initialValue: initialFavorited,
    action: async (next) => {
      const res = await toggleFavorite(profileId);
      if ("error" in res) {
        if (res.error?.includes("Sessão")) {
          window.location.href = "/entrar";
        }
        throw new Error(res.error ?? "Falha ao atualizar favorito");
      }
      return res.favorited ?? next;
    },
    onError: (err) => toast(err.message, "error"),
  });

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = `/entrar?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    toggle(!favorited);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-medium",
        "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        favorited
          ? "bg-rose text-white shadow-[var(--shadow-sm)] hover:brightness-105"
          : "border border-line bg-white text-ink hover:bg-line/30",
        pending && "opacity-50",
        extraClass,
      )}
    >
      <Heart
        className={cn("h-4 w-4", favorited && "fill-white")}
        strokeWidth={2}
      />
      {favorited ? "Curtido" : "Curtir"}
    </button>
  );
}
