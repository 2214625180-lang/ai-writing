interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  badge
}: PlaceholderPageProps) {
  return (
    <section className="card-surface max-w-5xl p-8">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium text-blue-700">{eyebrow}</p>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
    </section>
  );
}
