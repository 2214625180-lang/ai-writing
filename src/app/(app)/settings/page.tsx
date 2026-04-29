import Link from "next/link";
import { CreditCard, UserCircle } from "lucide-react";

import { getAccountInfo } from "@/services/account.service";

function formatDate(date: Date | null): string {
  if (!date) {
    return "暂无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatSubscriptionStatus(status: string | null): string {
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

export default async function SettingsPage() {
  const accountInfo = await getAccountInfo();
  const usagePercent =
    accountInfo.usage.limit > 0
      ? Math.min(
          100,
          Math.round((accountInfo.usage.used / accountInfo.usage.limit) * 100)
        )
      : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            设置
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            查看账户、订阅和用量信息。资料修改后续将通过 Clerk 用户中心接入。
          </p>
        </div>

        <Link
          href="/billing"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <CreditCard className="h-4 w-4" />
          前往 Billing
        </Link>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-950">账户信息</h2>
          <div className="mt-6 flex items-center gap-4">
            {accountInfo.user.imageUrl ? (
              <div
                role="img"
                aria-label={accountInfo.user.name ?? accountInfo.user.email}
                className="h-16 w-16 rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage: `url(${accountInfo.user.imageUrl})`
                }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <UserCircle className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-slate-950">
                {accountInfo.user.name ?? "未设置昵称"}
              </p>
              <p className="mt-1 truncate text-sm text-slate-500">
                {accountInfo.user.email}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-950">订阅信息</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">当前套餐</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {accountInfo.subscription.plan}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">订阅状态</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatSubscriptionStatus(accountInfo.subscription.status)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">周期结束时间</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatDate(accountInfo.subscription.currentPeriodEnd)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">周期结束取消</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {accountInfo.subscription.cancelAtPeriodEnd ? "是" : "否"}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">当前用量</h2>
            <p className="mt-2 text-sm text-slate-500">
              展示当前计费周期内的 AI 生成次数。
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            已用 {usagePercent}%
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">已使用</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {accountInfo.usage.used}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">额度</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {accountInfo.usage.limit}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">剩余</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {accountInfo.usage.remaining}
            </p>
          </div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-950"
            style={{
              width: `${usagePercent}%`
            }}
          />
        </div>
      </section>
    </div>
  );
}
