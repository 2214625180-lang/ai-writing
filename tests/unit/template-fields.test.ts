import { describe, expect, it } from "vitest";

import {
  buildPromptFromTemplateValues,
  parseTemplateFields,
  TemplateFieldValidationError,
  validateTemplateValues
} from "@/lib/template-fields";

const templateFields = [
  {
    name: "topic",
    label: "写作主题",
    type: "text",
    required: true
  },
  {
    name: "tone",
    label: "语气",
    type: "select",
    options: ["专业", "轻松"],
    required: false
  }
];

describe("template field parsing", () => {
  it("parses select fields with options", () => {
    const fields = parseTemplateFields(templateFields);

    expect(fields).toEqual([
      {
        name: "topic",
        label: "写作主题",
        type: "text",
        required: true,
        placeholder: undefined,
        description: undefined,
        options: undefined
      },
      {
        name: "tone",
        label: "语气",
        type: "select",
        required: false,
        placeholder: undefined,
        description: undefined,
        options: ["专业", "轻松"]
      }
    ]);
  });
});

describe("template value validation", () => {
  it("rejects missing required values", () => {
    const result = validateTemplateValues({
      fields: templateFields,
      values: {
        topic: "",
        tone: "专业"
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("写作主题 is required.");
  });

  it("rejects unknown fields and invalid select options", () => {
    const unknownFieldResult = validateTemplateValues({
      fields: templateFields,
      values: {
        topic: "AI 写作",
        extra: "unknown"
      }
    });
    const invalidOptionResult = validateTemplateValues({
      fields: templateFields,
      values: {
        topic: "AI 写作",
        tone: "严肃"
      }
    });

    expect(unknownFieldResult.success).toBe(false);
    expect(unknownFieldResult.error).toBe("Unknown template field: extra.");
    expect(invalidOptionResult.success).toBe(false);
    expect(invalidOptionResult.error).toBe("语气 has an invalid option.");
  });
});

describe("template prompt building", () => {
  it("replaces placeholders and appends a value summary once", () => {
    const prompt = buildPromptFromTemplateValues(
      "请围绕 {{ topic }} 写一篇文章，语气：{tone}。",
      {
        topic: "AI 写作",
        tone: "专业"
      },
      templateFields
    );

    expect(prompt).toContain("请围绕 AI 写作 写一篇文章，语气：专业。");
    expect(prompt).toContain("User provided values:");
    expect(prompt.match(/AI 写作/g)?.length).toBe(2);
  });

  it("throws for invalid values", () => {
    expect(() =>
      buildPromptFromTemplateValues(
        "请围绕 {{topic}} 写一篇文章。",
        {
          topic: ""
        },
        templateFields
      )
    ).toThrow(TemplateFieldValidationError);
  });
});

