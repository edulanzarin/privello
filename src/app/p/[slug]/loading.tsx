export default function ProfileLoading() {
    return (
        <div className="mx-auto max-w-2xl space-y-4 p-4">
            {/* Cover photo skeleton */}
            <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-black/[0.04]" />
            {/* Name + info skeleton */}
            <div className="space-y-2">
                <div className="h-7 w-40 animate-pulse rounded-lg bg-black/[0.04]" />
                <div className="h-4 w-64 animate-pulse rounded bg-black/[0.04]" />
                <div className="h-4 w-32 animate-pulse rounded bg-black/[0.04]" />
            </div>
            {/* Bio skeleton */}
            <div className="space-y-1.5">
                <div className="h-3.5 w-full animate-pulse rounded bg-black/[0.04]" />
                <div className="h-3.5 w-full animate-pulse rounded bg-black/[0.04]" />
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-black/[0.04]" />
            </div>
            {/* Gallery skeleton */}
            <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-lg bg-black/[0.04]" />
                ))}
            </div>
        </div>
    );
}
