const skeletonCards = ["usage", "plan", "shortcut-1", "shortcut-2", "shortcut-3", "shortcut-4"];

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-72 rounded bg-slate-200" />
        <div className="mt-4 h-4 w-full max-w-xl rounded bg-slate-200" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {skeletonCards.slice(0, 2).map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="h-24 rounded-lg bg-slate-100" />
              <div className="h-24 rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {skeletonCards.slice(2).map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="h-12 w-12 rounded-lg bg-slate-200" />
            <div className="mt-6 h-5 w-28 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-full rounded bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </section>
    </div>
  );
}
