"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FileText,
  History,
  type LucideIcon,
  LayoutDashboard,
  PenSquare,
  Settings,
  Shapes
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href: string;
  alternateHrefs?: readonly string[];
  icon: LucideIcon;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "AI 写作",
    href: "/generate",
    icon: PenSquare
  },
  {
    label: "文档",
    href: "/documents",
    icon: FileText
  },
  {
    label: "生成历史",
    href: "/history",
    icon: History
  },
  {
    label: "模板库",
    href: "/templates",
    icon: Shapes
  },
  {
    label: "订阅与账单",
    href: "/billing",
    icon: CreditCard
  },
  {
    label: "设置",
    href: "/settings",
    icon: Settings
  }
];

function isCurrentRoute(pathname: string, href: string, alternateHrefs?: readonly string[]) {
  if (pathname === href) {
    return true;
  }

  return alternateHrefs?.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ?? false;
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 lg:flex lg:min-h-screen lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <PenSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI 写作助手</p>
            <p className="text-xs text-slate-500">SaaS Workspace</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isCurrentRoute(pathname, item.href, item.alternateHrefs);

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-900 text-white shadow-soft"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">账户中心</p>
            <p className="text-xs text-slate-500">管理资料与会话</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}
