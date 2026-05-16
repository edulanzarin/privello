"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, hint, error, className, id, ...props }, ref) => {
        const textareaId = id || props.name || undefined;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={textareaId} className="block text-base font-medium text-foreground">
                        {label}
                    </label>
                )}
                {hint && <p className="text-sm text-muted">{hint}</p>}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        "w-full rounded-lg border border-black/10 bg-white px-3 py-[7px] text-md text-foreground",
                        "shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]",
                        "transition-all duration-150 resize-none",
                        "placeholder:text-muted/60",
                        "hover:border-black/20",
                        "focus:border-blue focus:outline-none focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]",
                        "disabled:bg-black/[0.03] disabled:text-muted disabled:cursor-not-allowed",
                        error && "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(255,59,48,0.2)]",
                        className,
                    )}
                    {...props}
                />
                {error && <p className="text-sm text-danger">{error}</p>}
            </div>
        );
    },
);

Textarea.displayName = "Textarea";
