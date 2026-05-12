import { Play } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PainelReelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reels</h1>
        <p className="mt-1 text-sm text-muted">
          Vídeos curtos em formato vertical para destacar sua personalidade.
        </p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 border border-dashed border-line bg-white text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-line">
          <Play className="h-8 w-8 text-muted" strokeWidth={1.25} />
        </div>
        <div>
          <p className="text-base font-semibold">Reels em breve</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Estamos desenvolvendo a funcionalidade de reels. Em breve você poderá publicar vídeos curtos no seu perfil.
          </p>
        </div>
      </div>
    </div>
  );
}
