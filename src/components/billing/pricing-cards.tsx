import { CheckCircle2, Sparkles } from "lucide-react";
import type { Plan } from "@prisma/client";

import { CheckoutButton } from "@/components/billing/checkout-button";
import type { CheckoutPlan } from "@/types/billing";

interface PricingPlan {
  code: Plan;
  name: string;
  monthlyGenerationLimit: number;
  features: string[];
}

interface PricingCardsProps {
  plans: PricingPlan[];
  currentPlan: Plan;
}

function isCheckoutPlan(plan: Plan): plan is CheckoutPlan {
  return plan === "PRO" || plan === "TEAM";
}

function formatGenerationLimit(limit: number): string {
  return new Intl.NumberFormat("zh-CN").format(limit);
}

export function PricingCards({ plans, currentPlan }: PricingCardsProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrentPlan = plan.code === currentPlan;
        const canUpgrade = isCheckoutPlan(plan.code) && !isCurrentPlan;

        return (
          <article
            key={plan.code}
            className={
              isCurrentPlan
                ? "rounded-3xl border-2 border-slate-950 bg-white p-6 shadow-xl"
                : "rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-950">
                    {plan.name}
                  </h2>
                  {isCurrentPlan ? (
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-medium text-white">
                      当前套餐
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  每月 {formatGenerationLimit(plan.monthlyGenerationLimit)} 次 AI 生成额度
                </p>
              </div>
              {plan.code !== "FREE" ? (
                <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">月度额度</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {formatGenerationLimit(plan.monthlyGenerationLimit)}
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-2 text-sm leading-6 text-slate-600"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan.code === "FREE" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-400"
                >
                  免费套餐
                </button>
              ) : (
                <CheckoutButton plan={plan.code} disabled={!canUpgrade} />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
