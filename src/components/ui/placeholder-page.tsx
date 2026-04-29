interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PlaceholderPage({
  eyebrow,
  title,
  description
}: PlaceholderPageProps) {
  return (
    <section className="card-surface max-w-4xl p-8">
      <p className="text-sm font-medium text-blue-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
    </section>
  );
}
