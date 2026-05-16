"use client";

import {
    cloneElement,
    createContext,
    isValidElement,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type ReactElement,
    type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { useEscapeKey } from "@/lib/hooks/use-escape-key";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

export type DropdownProps = {
    children: ReactNode;
    /** Estado controlado externamente. */
    open?: boolean;
    /** Estado inicial quando não controlado. Ignorado se `open` é definido. */
    defaultOpen?: boolean;
    /** Callback disparado em mudanças de estado (controlado ou não). */
    onOpenChange?: (open: boolean) => void;
};

export type DropdownTriggerProps = {
    children: ReactNode;
    /** Renderiza o filho como trigger sem wrapper. Padrão: false. */
    asChild?: boolean;
    className?: string;
};

export type DropdownContentProps = {
    children: ReactNode;
    className?: string;
    /** Alinhamento horizontal relativo ao trigger. */
    align?: "start" | "center" | "end";
    /**
     * Ativar focus trap. Padrão: true quando há ≥ 2 elementos focáveis.
     * Se passado explicitamente, sobrescreve o default.
     */
    trapFocus?: boolean;
};

export type DropdownItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "danger";
};

type DropdownContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext(component: string): DropdownContextValue {
    const ctx = useContext(DropdownContext);
    if (!ctx) {
        throw new Error(`${component} deve ser usado dentro de <Dropdown>`);
    }
    return ctx;
}

/**
 * Compound component:
 *   <Dropdown>
 *     <DropdownTrigger>...</DropdownTrigger>
 *     <DropdownContent>
 *       <DropdownItem>...</DropdownItem>
 *     </DropdownContent>
 *   </Dropdown>
 */
export function Dropdown({
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
}: DropdownProps) {
    const isControlled = openProp !== undefined;
    const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
    const open = isControlled ? !!openProp : internalOpen;
    const triggerRef = useRef<HTMLElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) setInternalOpen(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange],
    );

    return (
        <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
            <div className="relative inline-block">{children}</div>
        </DropdownContext.Provider>
    );
}

export function DropdownTrigger({
    children,
    asChild = false,
    className,
}: DropdownTriggerProps) {
    const { open, setOpen, triggerRef } = useDropdownContext("DropdownTrigger");

    const handleClick = useCallback(() => {
        setOpen(!open);
    }, [open, setOpen]);

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<{
            onClick?: (e: React.MouseEvent) => void;
            ref?: React.Ref<HTMLElement>;
            "aria-haspopup"?: string;
            "aria-expanded"?: boolean;
        }>;
        // Passar a ref como prop é uso legítimo; não estamos lendo `current` aqui.
        // eslint-disable-next-line react-hooks/refs
        return cloneElement(child, {
            ref: triggerRef as React.Ref<HTMLElement>,
            onClick: (e: React.MouseEvent) => {
                child.props.onClick?.(e);
                handleClick();
            },
            "aria-haspopup": "menu",
            "aria-expanded": open,
        });
    }

    return (
        <button
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={handleClick}
            className={className}
        >
            {children}
        </button>
    );
}

export function DropdownContent({
    children,
    className,
    align = "start",
    trapFocus,
}: DropdownContentProps) {
    const { open, setOpen, triggerRef, contentRef } =
        useDropdownContext("DropdownContent");
    const [focusableCount, setFocusableCount] = useState(0);

    useEscapeKey(() => setOpen(false), open);

    // Outside click
    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (contentRef.current?.contains(target)) return;
            if (triggerRef.current?.contains(target)) return;
            setOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, setOpen, contentRef, triggerRef]);

    // Conta elementos focáveis para decidir default de trapFocus.
    useEffect(() => {
        if (!open || !contentRef.current) return;
        const items = contentRef.current.querySelectorAll<HTMLElement>(
            "[role=\"menuitem\"]:not([disabled])",
        );
        setFocusableCount(items.length);
    }, [open, contentRef]);

    const shouldTrap = trapFocus ?? focusableCount >= 2;
    useFocusTrap(contentRef, open && shouldTrap);

    // Keyboard nav: ArrowDown/ArrowUp entre items.
    useEffect(() => {
        if (!open) return;
        function handleKeyNav(e: KeyboardEvent) {
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
            const container = contentRef.current;
            if (!container) return;
            const items = Array.from(
                container.querySelectorAll<HTMLElement>(
                    "[role=\"menuitem\"]:not([disabled])",
                ),
            );
            if (items.length === 0) return;
            const activeEl = document.activeElement as HTMLElement | null;
            const idx = activeEl ? items.indexOf(activeEl) : -1;
            e.preventDefault();
            const nextIdx =
                e.key === "ArrowDown"
                    ? idx < 0
                        ? 0
                        : (idx + 1) % items.length
                    : idx <= 0
                        ? items.length - 1
                        : idx - 1;
            items[nextIdx].focus();
        }
        document.addEventListener("keydown", handleKeyNav);
        return () => document.removeEventListener("keydown", handleKeyNav);
    }, [open, contentRef]);

    if (!open) return null;

    const alignClasses = {
        start: "left-0",
        center: "left-1/2 -translate-x-1/2",
        end: "right-0",
    } as const;

    return (
        <div
            ref={contentRef}
            role="menu"
            className={cn(
                "absolute top-full z-50 mt-1 min-w-[160px] rounded-xl border border-line bg-background py-1 shadow-lg",
                alignClasses[align],
                className,
            )}
        >
            {children}
        </div>
    );
}

export function DropdownItem({
    children,
    variant = "default",
    className,
    disabled,
    onClick,
    ...rest
}: DropdownItemProps) {
    const variantClasses = {
        default: "hover:bg-black/[0.04] focus:bg-black/[0.04]",
        danger: "text-danger hover:bg-danger/[0.06] focus:bg-danger/[0.06]",
    } as const;

    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex w-full items-center px-3 py-2 text-left text-sm transition-colors outline-none",
                disabled && "pointer-events-none opacity-40",
                !disabled && variantClasses[variant],
                className,
            )}
            {...rest}
        >
            {children}
        </button>
    );
}
