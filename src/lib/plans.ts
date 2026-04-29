import "server-only";

import { Plan } from "@prisma/client";

export type PlanCode = Plan;

export interface PlanDefinition {
  code: Plan;
  name: string;
  monthlyGenerationLimit: number;
  features: string[];
}

export const PLANS: Record<Plan, PlanDefinition> = {
  FREE: {
    code: "FREE",
    name: "Free",
    monthlyGenerationLimit: 20,
    features: ["基础 AI 写作", "最近历史记录", "基础模板访问"]
  },
  PRO: {
    code: "PRO",
    name: "Pro",
    monthlyGenerationLimit: 1000,
    features: ["高频写作生成", "完整历史记录", "高级模板访问", "优先体验新能力"]
  },
  TEAM: {
    code: "TEAM",
    name: "Team",
    monthlyGenerationLimit: 5000,
    features: ["团队协作场景", "更高生成额度", "共享模板能力", "团队级订阅支持"]
  }
};

export function getPlanGenerationLimit(plan: Plan): number {
  return PLANS[plan].monthlyGenerationLimit;
}
