"use client";

import { Heart } from "lucide-react";
import { useTransition, useState } from "react";
import { toggleFavorite } from "@/app/_actions/favorites";
import { cn } from "@/lib/utils";

type Props = {
  profileId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  className?: string;
};

export function FavoriteButton({ profileId, initialFavorited, isLoggedIn, className: extraClass }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = `/entrar?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    startTransition(async () => {
      const res = await toggleFavorite(profileId);
      if ("error" in res) {
        if (res.error?.includes("Sessão")) window.location.href = "/entrar";
        return;
      }
      if ("favorited" in res) setFavorited(res.favorited ?? false);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all active:scale-[0.97]",
        favorited
          ? "bg-coral text-white shadow-sm hover:brightness-110"
          : "bg-white border border-black/10 text-foreground shadow-sm hover:bg-black/[0.03]",
        pending && "opacity-50",
        extraClass,
      )}
    >
      <Heart
        className={cn("h-4 w-4", favorited && "fill-white")}
        strokeWidth={1.5}
      />
      {favorited ? "Curtido" : "Curtir"}
    </button>
  );
}
