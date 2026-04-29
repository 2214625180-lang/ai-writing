"use client";

import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const pageMetadata: Record<string, { label: string; title: string }> = {
  "/dashboard": {
    label: "Workspace",
    title: "控制台总览"
  },
  "/documents": {
    label: "Documents",
    title: "文档管理"
  },
  "/history": {
    label: "History",
    title: "生成历史"
  },
  "/templates": {
    label: "Templates",
    title: "写作模板"
  },
  "/billing": {
    label: "Billing",
    title: "订阅与账单"
  },
  "/settings": {
    label: "Settings",
    title: "工作区设置"
  }
};

export function DashboardHeader() {
  const pathname = usePathname();
  const metadata = pageMetadata[pathname] ?? pageMetadata["/dashboard"];

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm font-medium text-slate-500">{metadata.label}</p>
        <h1 className="text-lg font-semibold text-slate-900">{metadata.title}</h1>
      </div>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
