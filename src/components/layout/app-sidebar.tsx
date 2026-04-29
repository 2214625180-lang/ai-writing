import Link from "next/link";
import { FileText, History, LayoutTemplate, LayoutDashboard, Sparkles, CreditCard } from "lucide-react";

import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "总览", icon: LayoutDashboard },
  { href: "/dashboard/generate", label: "AI 生成", icon: Sparkles },
  { href: "/dashboard/history", label: "生成历史", icon: History },
  { href: "/dashboard/documents", label: "文档管理", icon: FileText },
  { href: "/dashboard/templates", label: "写作模板", icon: LayoutTemplate },
  { href: "/dashboard/billing", label: "订阅账单", icon: CreditCard }
];

export function AppSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/80 px-6 py-8 backdrop-blur lg:block">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">AI 写作助手</p>
          <p className="text-xs text-slate-500">SaaS Starter</p>
        </div>
      </div>

      <nav className="mt-10 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
