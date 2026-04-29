import { GenerationForm } from "@/components/generation/generation-form";

interface GeneratePageProps {
  searchParams?: {
    generationId?: string;
  };
}

export default function GeneratePage({ searchParams }: GeneratePageProps) {
  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <p className="text-sm font-medium text-blue-700">AI Writing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          AI 写作
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          输入写作需求，选择语气、语言和目标读者后开始生成内容。
        </p>
      </section>

      <GenerationForm initialGenerationId={searchParams?.generationId} />
    </div>
  );
}
