import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-8 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
        <Icon size={28} />
      </div>
      <h2 className="text-base font-semibold text-[#2a2a2a]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{description}</p>
      {action ? (
        <a
          href={action.href}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-blue-hover)]"
        >
          {action.label}
        </a>
      ) : null}
    </div>
  );
}
