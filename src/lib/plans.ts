export const SUBSCRIPTION_PLANS = {
  free: {
    code: "free",
    name: "Free",
    monthlyTokenLimit: 25_000,
    monthlyGenerationLimit: 25,
    features: ["基础写作生成", "最近历史记录", "模板浏览"]
  },
  pro: {
    code: "pro",
    name: "Pro",
    monthlyTokenLimit: 500_000,
    monthlyGenerationLimit: 500,
    features: ["高级模板", "完整历史管理", "订阅与账单", "优先模型接入"]
  }
} as const;

export type SubscriptionPlanCode = keyof typeof SUBSCRIPTION_PLANS;
