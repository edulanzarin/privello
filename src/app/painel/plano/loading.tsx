import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function PainelPlanoLoading() {
    return <LoadingSkeleton variant="card" count={3} ariaLabel="Carregando planos" />;
}
