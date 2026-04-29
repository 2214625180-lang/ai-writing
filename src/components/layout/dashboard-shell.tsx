import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-shell lg:flex">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
