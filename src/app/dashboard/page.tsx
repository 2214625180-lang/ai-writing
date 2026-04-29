import { BarChart3, Clock3, FileStack, Sparkles } from "lucide-react";

import { SUBSCRIPTION_PLANS } from "@/lib/plans";

const quickStats = [
  {
    label: "本月生成次数",
    value: "0 / 25",
    icon: Sparkles
  },
  {
    label: "文档数量",
    value: "0",
    icon: FileStack
  },
  {
    label: "剩余 Tokens",
    value: `${SUBSCRIPTION_PLANS.free.monthlyTokenLimit.toLocaleString()}`,
    icon: BarChart3
  },
  {
    label: "最近活动",
    value: "暂无记录",
    icon: Clock3
  }
];

const setupChecklist = [
  "配置 `.env` 中的 Clerk、PostgreSQL、OpenAI 和 Stripe 环境变量。",
  "执行 `npm install`、`npx prisma generate` 和 `npx prisma migrate dev` 初始化本地环境。",
  "在 Clerk 控制台中添加 `http://localhost:3000` 相关重定向地址。",
  "下一阶段在 `src/app/api/generate/stream/route.ts` 中接入流式生成接口。"
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-soft">
        <p className="text-sm font-medium text-blue-700">Initialization Ready</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          工程基础已就位，后续可以直接接入生成、历史和订阅能力。
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          当前页面展示的是初始化阶段的控制台。数据层、认证边界和页面骨架已经预留完成，
          这样后续实现核心业务时不需要再返工应用结构。
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.label} className="card-surface p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{item.label}</p>
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-6 text-2xl font-semibold text-slate-950">{item.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="card-surface p-6">
          <h3 className="text-lg font-semibold text-slate-900">模块落位</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "AI 写作生成",
              "生成历史管理",
              "文档管理",
              "写作模板",
              "用量统计",
              "Stripe 订阅"
            ].map((moduleName) => (
              <div
                key={moduleName}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
              >
                {moduleName}
              </div>
            ))}
          </div>
        </article>

        <article className="card-surface p-6">
          <h3 className="text-lg font-semibold text-slate-900">下一步</h3>
          <ol className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
            {setupChecklist.map((item, index) => (
              <li key={item}>
                {index + 1}. {item}
              </li>
            ))}
          </ol>
        </article>
      </section>
    </div>
  );
}
