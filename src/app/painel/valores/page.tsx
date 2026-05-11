import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveDurationOptions } from "@/app/painel/_actions/provider-settings";
import { SaveForm } from "@/components/painel/save-form";

export const dynamic = "force-dynamic";

// Fixed duration options — no free-form minutes
const DURATION_OPTIONS = [
  { minutes: 30,  label: "30 minutos" },
  { minutes: 60,  label: "1 hora" },
  { minutes: 90,  label: "1h30" },
  { minutes: 120, label: "2 horas" },
  { minutes: 180, label: "3 horas" },
  { minutes: 240, label: "4 horas" },
  { minutes: 720, label: "Pernoite" },
  { minutes: 1440, label: "Diária" },
];

export default async function PainelValoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { durationOptions: { where: { active: true }, orderBy: [{ sortOrder: "asc" }] } },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  // Map existing options by minutes for pre-filling
  const existingByMinutes = new Map(profile.durationOptions.map((o) => [o.minutes, o]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Valores e durações</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Defina o preço para cada duração. Deixe em branco as que não oferece.
        </p>
      </div>

      <SaveForm action={saveDurationOptions} successMessage="Valores salvos." className="space-y-4">
        <div className="border border-line bg-white overflow-hidden">
          {DURATION_OPTIONS.map(({ minutes, label }, i) => {
            const existing = existingByMinutes.get(minutes);
            return (
              <div key={minutes}
                className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
                {/* Hidden fields */}
                <input type="hidden" name={`dur_${i}_minutes`} value={minutes} />
                <input type="hidden" name={`dur_${i}_label`} value={label} />

                {/* Duration label */}
                <span className="w-28 text-sm font-semibold">{label}</span>

                {/* Price input */}
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-sm text-muted">R$</span>
                  <input
                    name={`dur_${i}_price`}
                    type="number"
                    min={0}
                    step={50}
                    defaultValue={existing?.priceBrl ?? ""}
                    placeholder="—"
                    className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted">
          Deixe o campo em branco para não oferecer aquela duração.
        </p>

        <button
          type="submit"
          className="bg-coral px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-coral/90"
        >
          Salvar valores
        </button>
      </SaveForm>
    </div>
  );
}
