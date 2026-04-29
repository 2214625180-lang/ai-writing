import { CustomerPortalButton } from "@/components/billing/customer-portal-button";
import { PricingCards } from "@/components/billing/pricing-cards";
import { PLANS } from "@/lib/plans";
import { billingService } from "@/services/billing.service";
import { userService } from "@/services/user.service";

function formatSubscriptionStatus(status?: string): string {
  switch (status) {
    case "ACTIVE":
      return "有效";
    case "TRIALING":
      return "试用中";
    case "PAST_DUE":
      return "付款逾期";
    case "CANCELED":
      return "已取消";
    case "INCOMPLETE":
      return "待完成";
    case "INCOMPLETE_EXPIRED":
      return "未完成已过期";
    default:
      return "暂无订阅";
  }
}

export default async function BillingPage() {
  const user = await userService.getCurrentUser();
  const subscription = await billingService.getSubscriptionByUserId(user.id);
  const plans = [PLANS.FREE, PLANS.PRO, PLANS.TEAM];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Billing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            订阅与账单
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            选择适合当前写作规模的套餐。支付和订阅管理由 Stripe Checkout 与 Customer Portal 处理。
          </p>
        </div>

        {user.stripeCustomerId ? <CustomerPortalButton /> : null}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">当前套餐</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {PLANS[user.plan].name}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">订阅状态</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatSubscriptionStatus(subscription?.status)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">月度生成额度</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {PLANS[user.plan].monthlyGenerationLimit.toLocaleString("zh-CN")}
          </p>
        </div>
      </div>

      <PricingCards plans={plans} currentPlan={user.plan} />
    </div>
  );
}
