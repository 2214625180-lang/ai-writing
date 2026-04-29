"use client";

import { useState } from "react";
import { LayoutTemplate } from "lucide-react";

import { TemplateCard } from "@/components/templates/template-card";
import type { TemplateListItem } from "@/types/template";

interface TemplateListProps {
  templates: TemplateListItem[];
}

export function TemplateList({ templates }: TemplateListProps) {
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(
    templates[0]?.id ?? null
  );

  if (templates.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <LayoutTemplate className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-950">暂无可用模板</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          当前没有启用的写作模板。后续可在后台或种子数据中添加博客、SEO、广告文案等模板。
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isExpanded={expandedTemplateId === template.id}
          onToggle={() =>
            setExpandedTemplateId((current) =>
              current === template.id ? null : template.id
            )
          }
        />
      ))}
    </div>
  );
}
