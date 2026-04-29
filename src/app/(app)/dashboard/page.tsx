import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  CreditCard,
  FileText,
  PenSquare,
  Shapes,
  Zap
} from "lucide-react";

import { PLANS } from "@/lib/plans";
import { usageService } from "@/services/usage.service";
import { userService } from "@/services/user.service";

const quickLinks = [
  {
    title: "开始 AI 写作",
    description: "进入写作工作流，准备生成新的内容。",
    href: "/dashboard",
    icon: PenSquare
  },
  {
    title: "查看文档",
    description: "管理保存的文章、邮件和文案草稿。",
    href: "/documents",
    icon: FileText
  },
  {
    title: "查看生成历史",
    description: "回看最近的 AI 生成结果和用量记录。",
    href: "/history",
    icon: Clock3
  },
  {
    title: "查看模板库",
    description: "选择博客、SEO、广告文案等写作模板。",
    href: "/templates",
    icon: Shapes
  }
];

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  const monthNumber = Number(month);

  if (!year || Number.isNaN(monthNumber)) {
    return period;
  }

  return `${year}年${monthNumber}月`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default async function DashboardPage() {
  const currentUser = await userService.getCurrentUser();
  const [currentUsage, monthlyUsage] = await Promise.all([
    usageService.getCurrentUsage(),
    usageService.getCurrentUserMonthUsage()
  ]);

  const displayName = currentUser.name?.trim() || currentUser.email;
  const planDefinition = PLANS[currentUsage.plan];
  const periodLabel = formatPeriodLabel(currentUsage.period);
  const usagePercent =
    currentUsage.limit > 0
      ? Math.min((currentUsage.used / currentUsage.limit) * 100, 100)
      : 0;
  const shouldShowUpgradeCta = usagePercent >= 80 && currentUsage.plan !== "TEAM";

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Workspace Overview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              欢迎回来，{displayName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              查看当前套餐、{periodLabel}用量和常用工作入口。
            </p>
          </div>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <CreditCard className="h-4 w-4" />
            管理订阅
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">当前套餐</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {planDefinition?.name ?? currentUsage.plan}
              </h2>
            </div>
            <span
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
              title={`用量周期：${currentUsage.period}`}
            >
              {periodLabel}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">已生成</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {formatNumber(currentUsage.used)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">额度上限</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {formatNumber(currentUsage.limit)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">剩余额度</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {formatNumber(currentUsage.remaining)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Token 用量</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {formatNumber(monthlyUsage.tokensUsed)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>本周期写作用量</span>
              <span>{usagePercent.toFixed(0)}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {shouldShowUpgradeCta ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-amber-950">本周期额度即将用完</p>
                <p className="mt-1 text-sm text-amber-800">
                  升级套餐可获得更高的每月生成额度。
                </p>
              </div>
              <Link
                href="/billing"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Zap className="h-4 w-4" />
                升级套餐
              </Link>
            </div>
          ) : null}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">套餐能力</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {planDefinition?.name ?? currentUsage.plan}
          </h2>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
            {(planDefinition?.features ?? []).map((feature) => (
              <li key={feature} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                {feature}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                进入
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
