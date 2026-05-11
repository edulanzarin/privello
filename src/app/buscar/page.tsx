import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BuscarForm } from "./buscar-form";

export const dynamic = "force-dynamic";

export default function BuscarPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Buscar</h1>
        <p className="mt-2 text-sm text-muted">
          Digite uma cidade para encontrar acompanhantes na região.
        </p>
        <div className="mt-8">
          <BuscarForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
