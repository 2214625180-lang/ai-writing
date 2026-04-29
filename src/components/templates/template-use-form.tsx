"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Wand2 } from "lucide-react";

import { createGenerationFromTemplateAction } from "@/actions/templates";

interface TemplateUseFormProps {
  templateId: string;
  fields: unknown;
}

interface TemplateField {
  name: string;
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
  required: boolean;
  description?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeFieldFromRecord(
  field: Record<string, unknown>,
  fallbackName: string
): TemplateField {
  const name =
    typeof field.name === "string"
      ? field.name
      : typeof field.key === "string"
        ? field.key
        : typeof field.id === "string"
          ? field.id
          : fallbackName;
  const label = typeof field.label === "string" ? field.label : name;
  const type = field.type === "textarea" || field.multiline === true ? "textarea" : "text";

  return {
    name,
    label,
    type,
    placeholder:
      typeof field.placeholder === "string" ? field.placeholder : undefined,
    required: field.required !== false,
    description:
      typeof field.description === "string" ? field.description : undefined
  };
}

function parseTemplateFields(fields: unknown): TemplateField[] {
  if (Array.isArray(fields)) {
    const parsedFields = fields
      .map((field, index): TemplateField | null => {
        if (typeof field === "string") {
          return {
            name: field,
            label: field,
            type: "text",
            required: true
          };
        }

        if (isRecord(field)) {
          return normalizeFieldFromRecord(field, `field_${index + 1}`);
        }

        return null;
      })
      .filter((field): field is TemplateField => Boolean(field));

    if (parsedFields.length > 0) {
      return parsedFields;
    }
  }

  if (isRecord(fields)) {
    return Object.entries(fields).map(([key, value]) => {
      if (isRecord(value)) {
        return normalizeFieldFromRecord(
          {
            name: key,
            ...value
          },
          key
        );
      }

      return {
        name: key,
        label: key,
        type: "text",
        required: true
      };
    });
  }

  return [
    {
      name: "topic",
      label: "写作主题",
      type: "textarea",
      placeholder: "输入你希望模板围绕的主题、背景或核心要求。",
      required: true
    }
  ];
}

function buildInitialValues(fields: TemplateField[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.name] = "";

    return values;
  }, {});
}

export function TemplateUseForm({ templateId, fields }: TemplateUseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const normalizedFields = useMemo(() => parseTemplateFields(fields), [fields]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialValues(normalizedFields)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateValue(fieldName: string, value: string) {
    setValues((current) => ({
      ...current,
      [fieldName]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createGenerationFromTemplateAction({
        templateId,
        values
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      router.push(`/generate?generationId=${result.data.generationId}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="grid gap-4">
        {normalizedFields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`${templateId}-${field.name}`}
              className="text-sm font-medium text-slate-900"
            >
              {field.label}
            </label>
            {field.description ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {field.description}
              </p>
            ) : null}

            {field.type === "textarea" ? (
              <textarea
                id={`${templateId}-${field.name}`}
                value={values[field.name] ?? ""}
                onChange={(event) => updateValue(field.name, event.target.value)}
                required={field.required}
                rows={4}
                placeholder={field.placeholder}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            ) : (
              <input
                id={`${templateId}-${field.name}`}
                value={values[field.name] ?? ""}
                onChange={(event) => updateValue(field.name, event.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            )}
          </div>
        ))}
      </div>

      {errorMessage ? (
        <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            创建生成任务
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            使用模板生成
          </>
        )}
      </button>
    </form>
  );
}
