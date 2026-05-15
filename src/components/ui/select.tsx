"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    hint?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, hint, error, options, placeholder, className, id, ...props }, ref) => {
        const selectId = id || props.name || undefined;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={selectId} className="block text-[13px] font-medium text-foreground">
                        {label}
                    </label>
                )}
                {hint && <p className="text-[12px] text-muted">{hint}</p>}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        "w-full appearance-none rounded-lg border border-black/10 bg-white px-3 py-[7px] text-[14px] text-foreground",
                        "shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]",
                        "transition-all duration-150 cursor-pointer",
                        "hover:border-black/20",
                        "focus:border-[#0a84ff] focus:outline-none focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]",
                        "disabled:bg-black/[0.03] disabled:text-muted disabled:cursor-not-allowed",
                        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2386868b%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8",
                        error && "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(255,59,48,0.2)]",
                        className,
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-[12px] text-[#ff3b30]">{error}</p>}
            </div>
        );
    },
);

Select.displayName = "Select";
