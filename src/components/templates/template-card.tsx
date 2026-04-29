"use client";

import { ChevronDown, ChevronUp, Crown } from "lucide-react";

import { TemplateUseForm } from "@/components/templates/template-use-form";
import type { TemplateListItem } from "@/types/template";

interface TemplateCardProps {
  template: TemplateListItem;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TemplateCard({
  template,
  isExpanded,
  onToggle
}: TemplateCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:border-slate-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">
              {template.name}
            </h2>
            {template.isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Crown className="h-3.5 w-3.5" />
                Pro
              </span>
            ) : null}
          </div>

          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {template.description}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {template.category}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            收起表单
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            使用模板
          </>
        )}
      </button>

      {isExpanded ? (
        <TemplateUseForm templateId={template.id} fields={template.fields} />
      ) : null}
    </article>
  );
}
