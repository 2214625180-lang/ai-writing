export type TemplateFieldType = "text" | "textarea" | "select";

export interface TemplateFieldDefinition {
  name: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  required: boolean;
  description?: string;
  options?: string[];
}

export interface TemplateValuesValidationResult {
  success: boolean;
  values: Record<string, string>;
  error?: string;
}

export class TemplateFieldValidationError extends Error {
  constructor(message = "Invalid template values.") {
    super(message);
    this.name = "TemplateFieldValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeFieldType(value: unknown): TemplateFieldType {
  if (value === "textarea" || value === "select") {
    return value;
  }

  return "text";
}

function normalizeOptions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const options = value
    .filter((option): option is string => typeof option === "string")
    .map((option) => option.trim())
    .filter(Boolean);

  return options.length > 0 ? options : undefined;
}

function normalizeFieldFromRecord(
  field: Record<string, unknown>,
  fallbackName: string
): TemplateFieldDefinition {
  const name =
    normalizeString(field.name) ??
    normalizeString(field.key) ??
    normalizeString(field.id) ??
    fallbackName;
  const type = normalizeFieldType(field.type);

  return {
    name,
    label: normalizeString(field.label) ?? name,
    type,
    placeholder: normalizeString(field.placeholder),
    required: field.required !== false,
    description: normalizeString(field.description),
    options: type === "select" ? normalizeOptions(field.options) : undefined
  };
}

export function parseTemplateFields(fields: unknown): TemplateFieldDefinition[] {
  if (Array.isArray(fields)) {
    const parsedFields = fields
      .map((field, index): TemplateFieldDefinition | null => {
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
      .filter((field): field is TemplateFieldDefinition => Boolean(field));

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

  return [];
}

export function validateTemplateValues(params: {
  fields: unknown;
  values: Record<string, string>;
  maxValueLength?: number;
}): TemplateValuesValidationResult {
  const maxValueLength = params.maxValueLength ?? 10_000;
  const fields = parseTemplateFields(params.fields);
  const allowedFieldNames = new Set(fields.map((field) => field.name));
  const validatedValues: Record<string, string> = {};

  for (const field of fields) {
    const value = params.values[field.name]?.trim() ?? "";

    if (field.required && !value) {
      return {
        success: false,
        values: {},
        error: `${field.label} is required.`
      };
    }

    if (value.length > maxValueLength) {
      return {
        success: false,
        values: {},
        error: `${field.label} is too long.`
      };
    }

    if (field.type === "select" && value && field.options?.length) {
      if (!field.options.includes(value)) {
        return {
          success: false,
          values: {},
          error: `${field.label} has an invalid option.`
        };
      }
    }

    validatedValues[field.name] = value;
  }

  for (const [key, value] of Object.entries(params.values)) {
    if (!allowedFieldNames.has(key)) {
      return {
        success: false,
        values: {},
        error: `Unknown template field: ${key}.`
      };
    }

    if (value.trim().length > maxValueLength) {
      return {
        success: false,
        values: {},
        error: `${key} is too long.`
      };
    }
  }

  return {
    success: true,
    values: validatedValues
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyPromptValue(prompt: string, key: string, value: string): string {
  const escapedKey = escapeRegExp(key);
  const patterns = [
    new RegExp(`{{\\s*${escapedKey}\\s*}}`, "g"),
    new RegExp(`{\\s*${escapedKey}\\s*}`, "g")
  ];

  return patterns.reduce(
    (currentPrompt, pattern) => currentPrompt.replace(pattern, value),
    prompt
  );
}

export function buildPromptFromTemplateValues(
  templatePrompt: string,
  values: Record<string, string>,
  fields?: unknown
): string {
  const validationResult = fields
    ? validateTemplateValues({
        fields,
        values
      })
    : {
        success: true,
        values: Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key.trim(), value.trim()])
        )
      };

  if (!validationResult.success) {
    throw new TemplateFieldValidationError(validationResult.error);
  }

  const normalizedValues = Object.entries(validationResult.values);
  const promptWithValues = normalizedValues.reduce(
    (currentPrompt, [key, value]) =>
      key ? applyPromptValue(currentPrompt, key, value) : currentPrompt,
    templatePrompt
  );
  const valueSummary = normalizedValues
    .filter(([key, value]) => key && value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  if (!valueSummary) {
    return promptWithValues;
  }

  return `${promptWithValues}\n\nUser provided values:\n${valueSummary}`;
}
