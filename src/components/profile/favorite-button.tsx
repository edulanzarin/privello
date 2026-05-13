"use client";

import { Heart } from "lucide-react";
import { useTransition, useState } from "react";
import { toggleFavorite } from "@/app/_actions/favorites";
import { cn } from "@/lib/utils";

type Props = {
  profileId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
};

export function FavoriteButton({ profileId, initialFavorited, isLoggedIn }: Props) {
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
        "inline-flex items-center justify-center gap-2 border px-6 py-3 text-sm font-medium transition",
        favorited
          ? "border-coral bg-coral text-white hover:bg-coral/90"
          : "border-foreground text-foreground hover:bg-black/5",
        pending && "opacity-60",
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
