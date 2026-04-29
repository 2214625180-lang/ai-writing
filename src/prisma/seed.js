const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const templates = [
  {
    id: "tpl_blog_outline",
    name: "博客文章大纲",
    description: "根据主题生成结构清晰、层次明确的博客文章大纲。",
    category: "博客写作",
    prompt:
      "请围绕主题 {{topic}} 生成一份博客文章大纲。语气：{{tone}}。输出语言：{{language}}。请包含标题、引言、3-5 个主体章节和结尾。",
    fields: [
      {
        name: "topic",
        label: "写作主题",
        type: "text",
        placeholder: "例如：AI 写作工具如何提升内容生产效率",
        required: true
      },
      {
        name: "tone",
        label: "写作语气",
        type: "text",
        placeholder: "例如：专业、轻松、有说服力",
        required: false
      },
      {
        name: "language",
        label: "输出语言",
        type: "text",
        placeholder: "例如：中文",
        required: false
      }
    ],
    isPremium: false,
    isActive: true
  },
  {
    id: "tpl_seo_titles",
    name: "SEO 标题生成器",
    description: "根据关键词和目标读者生成适合搜索引擎优化的标题。",
    category: "SEO",
    prompt:
      "请基于关键词 {{keyword}} 为目标读者 {{audience}} 生成 10 个 SEO 标题。要求标题清晰、有点击吸引力，避免夸张承诺。",
    fields: [
      {
        name: "keyword",
        label: "核心关键词",
        type: "text",
        placeholder: "例如：AI 写作助手",
        required: true
      },
      {
        name: "audience",
        label: "目标读者",
        type: "text",
        placeholder: "例如：内容运营、创业者、市场团队",
        required: false
      }
    ],
    isPremium: false,
    isActive: true
  },
  {
    id: "tpl_ad_copy",
    name: "广告文案",
    description: "为产品或活动生成简洁有力的广告文案。",
    category: "广告文案",
    prompt:
      "请为产品 {{product}} 写 5 组广告文案。卖点：{{sellingPoints}}。目标人群：{{audience}}。每组包含主标题和一句行动号召。",
    fields: [
      {
        name: "product",
        label: "产品或活动",
        type: "text",
        placeholder: "例如：AI 写作助手 Pro 套餐",
        required: true
      },
      {
        name: "sellingPoints",
        label: "核心卖点",
        type: "textarea",
        placeholder: "例如：快速生成、多模板、团队协作",
        required: true
      },
      {
        name: "audience",
        label: "目标人群",
        type: "text",
        placeholder: "例如：中小企业市场团队",
        required: false
      }
    ],
    isPremium: false,
    isActive: true
  },
  {
    id: "tpl_email_campaign",
    name: "营销邮件",
    description: "生成适合新品发布、活动促销或用户召回的邮件草稿。",
    category: "邮件写作",
    prompt:
      "请写一封营销邮件。邮件目标：{{goal}}。受众：{{audience}}。关键信息：{{keyPoints}}。要求包含主题行、正文和 CTA。",
    fields: [
      {
        name: "goal",
        label: "邮件目标",
        type: "text",
        placeholder: "例如：发布新功能、邀请升级、用户召回",
        required: true
      },
      {
        name: "audience",
        label: "受众",
        type: "text",
        placeholder: "例如：免费用户、试用用户、老客户",
        required: true
      },
      {
        name: "keyPoints",
        label: "关键信息",
        type: "textarea",
        placeholder: "列出需要包含的优惠、功能或时间信息",
        required: true
      }
    ],
    isPremium: true,
    isActive: true
  },
  {
    id: "tpl_landing_page",
    name: "落地页文案",
    description: "为 SaaS 产品生成完整落地页结构和关键文案。",
    category: "产品营销",
    prompt:
      "请为 {{product}} 生成 SaaS 落地页文案。目标用户：{{audience}}。核心价值：{{valueProposition}}。请包含 Hero、痛点、功能、社会证明、价格引导和 CTA。",
    fields: [
      {
        name: "product",
        label: "产品名称",
        type: "text",
        placeholder: "例如：AI 写作助手",
        required: true
      },
      {
        name: "audience",
        label: "目标用户",
        type: "text",
        placeholder: "例如：内容团队、营销团队、创业公司",
        required: true
      },
      {
        name: "valueProposition",
        label: "核心价值",
        type: "textarea",
        placeholder: "例如：减少写作时间，提升内容质量，统一品牌语气",
        required: true
      }
    ],
    isPremium: true,
    isActive: true
  },
  {
    id: "tpl_social_posts",
    name: "社媒内容计划",
    description: "基于主题生成多平台社媒发布计划和短文案。",
    category: "社媒运营",
    prompt:
      "请基于主题 {{topic}} 生成一周社媒内容计划。平台：{{platforms}}。品牌语气：{{tone}}。每天包含发布角度、短文案和 CTA。",
    fields: [
      {
        name: "topic",
        label: "内容主题",
        type: "text",
        placeholder: "例如：AI 写作效率提升",
        required: true
      },
      {
        name: "platforms",
        label: "发布平台",
        type: "text",
        placeholder: "例如：小红书、公众号、LinkedIn",
        required: false
      },
      {
        name: "tone",
        label: "品牌语气",
        type: "text",
        placeholder: "例如：专业但不严肃",
        required: false
      }
    ],
    isPremium: true,
    isActive: true
  }
];

async function main() {
  for (const template of templates) {
    await prisma.template.upsert({
      where: {
        id: template.id
      },
      create: template,
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        prompt: template.prompt,
        fields: template.fields,
        isPremium: template.isPremium,
        isActive: template.isActive
      }
    });
  }

  console.log(`Seeded ${templates.length} writing templates.`);
}

main()
  .catch((error) => {
    console.error("Failed to seed templates.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
