import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, BarChart3 } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

const featureCards = [
  {
    title: "受保护工作区",
    description: "基于 Clerk 的身份认证与路由保护，后续可平滑扩展团队与角色能力。",
    icon: ShieldCheck
  },
  {
    title: "AI 写作工作流",
    description: "预留生成、历史、文档、模板与用量模块，为后续 OpenAI 接入提供清晰边界。",
    icon: Sparkles
  },
  {
    title: "SaaS 订阅基础",
    description: "预置 Prisma 与 Stripe 账单模型，避免后期补齐订阅数据结构时产生迁移噪音。",
    icon: BarChart3
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-hero-grid">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-soft">
            Next.js 14 + Clerk + Prisma + OpenAI
          </div>
          <h1 className="mt-8 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            为 AI 写作助手 SaaS 准备一个可持续演进的工程骨架。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            当前阶段专注于项目初始化、认证集成、数据模型、基础布局和受保护路由，
            让后续业务开发从一开始就落在稳定边界上。
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <SignedOut>
              <Link href="/sign-up">
                <Button className="gap-2">
                  开始创建工作区
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="gap-2">
                  进入控制台
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
            <Link href="/sign-in">
              <Button variant="secondary">登录已有账号</Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="card-surface p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-slate-900">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
