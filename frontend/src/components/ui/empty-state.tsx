import React from 'react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    illustration?: string; // emoji
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    illustration = '📭',
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
            {Icon ? (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <Icon className="h-8 w-8 text-slate-300" />
                </div>
            ) : (
                <div className="mb-4 text-5xl">{illustration}</div>
            )}
            <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            {description && (
                <p className="mt-1.5 max-w-xs text-sm text-slate-500">{description}</p>
            )}
            {action && (
                <div className="mt-5">
                    {action.href ? (
                        <a
                            href={action.href}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            {action.label}
                        </a>
                    ) : (
                        <button
                            onClick={action.onClick}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Skeleton Variants ──────────────────────────────────────────────────
export function SkeletonCard({ className = 'h-28' }: { className?: string }) {
    return <div className={`card animate-pulse bg-slate-100 ${className}`} />;
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 py-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/3" />
                <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
            </div>
            <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="card space-y-0 overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-slate-100">
                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-slate-50 px-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonRow key={i} />
                ))}
            </div>
        </div>
    );
}
