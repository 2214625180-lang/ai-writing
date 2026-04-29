import { UserButton } from "@clerk/nextjs";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm font-medium text-slate-500">Workspace</p>
        <h1 className="text-lg font-semibold text-slate-900">写作工作台</h1>
      </div>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
