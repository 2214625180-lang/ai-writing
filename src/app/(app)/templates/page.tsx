import { TemplateList } from "@/components/templates/template-list";
import { getTemplates } from "@/services/template.service";

export default async function TemplatesPage() {
  const templates = await getTemplates({
    includePremium: true
  });
  const categories = new Set(templates.map((template) => template.category));
  const premiumCount = templates.filter((template) => template.isPremium).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Templates</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            模板库
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            选择博客、SEO、广告文案等写作模板，填写关键字段后创建 AI 生成任务。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center sm:min-w-80">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <p className="text-xs text-slate-500">模板</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {templates.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <p className="text-xs text-slate-500">分类</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {categories.size}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <p className="text-xs text-slate-500">Pro</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {premiumCount}
            </p>
          </div>
        </div>
      </section>

      <TemplateList templates={templates} />
    </div>
  );
}
