import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    subtitle?: string;
    className?: string;
    children?: React.ReactNode;
}

export function StatCard({ label, value, icon: Icon, subtitle, className, children }: StatCardProps) {
    return (
        <div
            className={cn(
                "glass-card rounded-2xl p-5 transition-all duration-200 hover:shadow-md",
                className,
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted">{label}</p>
                {Icon && <Icon className="h-4 w-4 text-muted" strokeWidth={1.5} />}
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
            {children && <div className="mt-3">{children}</div>}
        </div>
    );
}
