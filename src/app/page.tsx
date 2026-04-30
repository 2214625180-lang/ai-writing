import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, BarChart3, Feather } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const featureCards = [
  {
    title: "受保护工作区",
    description: "基于 Clerk 的身份认证与路由级安全保护。",
    icon: ShieldCheck
  },
  {
    title: "AI 写作工作流",
    description: "预留生成、历史、文档、模板与用量控制模块。",
    icon: Sparkles
  },
  {
    title: "SaaS 订阅基础",
    description: "预置 Prisma 数据库与 Stripe 账单支付模型。",
    icon: BarChart3
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header 导航栏 */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Feather className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            NovaWrite
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              登录
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                免费开始
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              控制台
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Hero Section 主视觉区 */}
      <main className="relative mx-auto flex max-w-6xl flex-col px-6 py-20 sm:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50/50 px-4 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Next.js 14 + Clerk + Prisma + OpenAI
          </div>
          
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
            释放无限灵感，<br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              你的专属 AI 写作助手
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            采用旗舰级 LLM 大语言模型，打破创作瓶颈。无论是博客、文案还是毕业设计，都能为你带来前所未有的流畅写作体验。
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg" className="bg-indigo-600 text-md gap-2 hover:bg-indigo-700">
                  开始创建工作区
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="bg-indigo-600 text-md gap-2 hover:bg-indigo-700">
                  进入控制台
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-md border-slate-300 text-slate-700 hover:bg-slate-100">
                登录已有账号
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards 特性卡片 */}
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <article 
                key={card.title} 
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-slate-900">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}