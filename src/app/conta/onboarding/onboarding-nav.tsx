"use client";

import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

type Props = Omit<LinkProps, "href"> & {
    href: string;
    children: ReactNode;
    className?: string;
};

/**
 * Wrapper de `<Link>` que tagueia a navegação com `transitionTypes`
 * para casar com `<ViewTransition enter/exit>` nos page.tsx do onboarding.
 *
 * Cf. node_modules/next/dist/docs/01-app/02-guides/view-transitions.md
 *  e .kiro/specs/fase-5-ux/design.md > Components and Interfaces > 6.
 */
export function OnboardingNext({ href, children, className, ...rest }: Props) {
    return (
        <Link href={href} transitionTypes={["nav-forward"]} className={className} {...rest}>
            {children}
        </Link>
    );
}

export function OnboardingBack({ href, children, className, ...rest }: Props) {
    return (
        <Link href={href} transitionTypes={["nav-back"]} className={className} {...rest}>
            {children}
        </Link>
    );
}
