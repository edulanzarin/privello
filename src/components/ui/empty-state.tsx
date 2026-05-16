import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: EmptyStateAction;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    className,
}: EmptyStateProps) {
    const renderAction = () => {
        if (!action) return null;
        const baseClasses =
            "inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-md font-medium text-white transition-opacity hover:opacity-90";
        if (action.href) {
            return (
                <Link
                    href={action.href}
                    onClick={action.onClick}
                    className={baseClasses}
                >
                    {action.label}
                </Link>
            );
        }
        if (action.onClick) {
            return (
                <button
                    type="button"
                    onClick={action.onClick}
                    className={baseClasses}
                >
                    {action.label}
                </button>
            );
        }
        return null;
    };

    return (
        <div
            className={cn(
                "rounded-2xl border border-black/[0.06] bg-white px-6 py-14 text-center shadow-sm",
                className,
            )}
        >
            {icon ? (
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center text-muted">
                    {icon}
                </div>
            ) : null}
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            {description ? (
                <p className="mx-auto mt-2 max-w-md text-md text-muted">
                    {description}
                </p>
            ) : null}
            {action ? <div className="mt-5">{renderAction()}</div> : null}
        </div>
    );
}
