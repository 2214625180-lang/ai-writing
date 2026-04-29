export default function BillingPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Billing</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        这里将用于查看套餐、订阅状态和账单信息，后续会接入 Stripe 订阅与支付能力。
      </p>
    </section>
  );
}
