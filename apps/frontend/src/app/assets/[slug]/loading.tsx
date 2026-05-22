export default function AssetDetailLoading() {
  return (
    <main className="marketplace-shell animate-pulse pb-24 pt-10 sm:pt-12 lg:pb-14 lg:pt-14">
      <div className="mb-8 h-5 w-72 rounded bg-neutral-200" />
      <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(336px,28rem)] lg:items-start">
        <div className="space-y-10">
          <div className="aspect-[4/3] w-full max-w-[52rem] rounded-[1.65rem] bg-neutral-200 lg:aspect-[16/11]" />
          <div className="max-w-[52rem] space-y-3">
            <div className="h-6 w-44 rounded bg-neutral-200" />
            <div className="h-24 w-full rounded-lg bg-neutral-100" />
          </div>
        </div>
        <aside className="min-w-0 space-y-6">
          <div className="h-8 w-56 rounded bg-neutral-200" />
          <div className="h-[22rem] rounded-[1.65rem] bg-neutral-100" />
          <div className="h-12 w-full rounded-xl bg-neutral-200" />
        </aside>
      </div>
    </main>
  );
}

