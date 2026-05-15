export default function FinanceiroLoading() {
    return (
        <div className="space-y-4 p-4">
            {/* Header skeleton */}
            <div className="h-8 w-48 animate-pulse rounded-lg bg-black/[0.04]" />
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-black/[0.04]" />
                ))}
            </div>
            {/* Table skeleton */}
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-black/[0.04]" />
                ))}
            </div>
        </div>
    );
}
