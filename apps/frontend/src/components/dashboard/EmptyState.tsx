import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-8 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#009ab6]/10 text-[#009ab6]">
        <Icon size={28} />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{description}</p>
      {action ? (
        <a
          href={action.href}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#009ab6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007a8a]"
        >
          {action.label}
        </a>
      ) : null}
    </div>
  );
}
