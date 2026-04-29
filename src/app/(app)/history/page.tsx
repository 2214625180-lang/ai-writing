import { GenerationHistoryList } from "@/components/history/generation-history-list";
import { generationService } from "@/services/generation.service";
import { userService } from "@/services/user.service";

export default async function HistoryPage() {
  const user = await userService.getCurrentUser();
  const history = await generationService.getGenerationHistory(user.id, {
    page: 1,
    pageSize: 20
  });

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <p className="text-sm font-medium text-blue-700">Generation History</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          生成历史
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          查看最近的 AI 生成记录、模型、状态和 Token 消耗。
        </p>
      </section>

      <GenerationHistoryList history={history} />
    </div>
  );
}
