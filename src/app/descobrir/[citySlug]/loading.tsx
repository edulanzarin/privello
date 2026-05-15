export default function DiscoverLoading() {
    return (
        <div className="space-y-4 p-4">
            {/* Filter bar skeleton */}
            <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-black/[0.04]" />
                ))}
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="aspect-[3/4] animate-pulse rounded-xl bg-black/[0.04]" />
                        <div className="h-4 w-24 animate-pulse rounded bg-black/[0.04]" />
                        <div className="h-3 w-16 animate-pulse rounded bg-black/[0.04]" />
                    </div>
                ))}
            </div>
        </div>
    );
}
