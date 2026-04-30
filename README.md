# AI 写作助手 SaaS 初始化项目

这是一个基于 `Next.js 14`、`App Router`、`TypeScript`、`Tailwind CSS`、`Prisma`、`PostgreSQL`、`Clerk`、`OpenAI` 和 `Stripe` 的 AI 写作助手 SaaS 项目。

## 已完成

- 工程基础配置
- Clerk 身份认证接入
- Prisma 数据模型初始化
- 应用级基础布局与侧边栏
- 受保护的 Dashboard 路由
- 生成接口与 Stripe Webhook 路由占位

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量并填写真实值：

```bash
cp .env.example .env
```

3. 生成 Prisma Client 并执行迁移：

```bash
npx prisma generate --schema src/prisma/schema.prisma
npx prisma migrate dev --schema src/prisma/schema.prisma --name init
```

4. 启动开发环境：

```bash
npm run dev
```
