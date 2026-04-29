# AGENTS.md

## 1. 项目技术栈

- Next.js 14
- App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Clerk Auth
- OpenAI API
- Stripe

## 2. 目录结构约定

- `src/app`：页面、路由、布局、Route Handlers
- `src/actions`：Server Actions，按业务域拆分
- `src/components`：可复用 UI 与布局组件
- `src/lib`：基础库、SDK 初始化、工具函数、配置
- `src/services`：面向业务的服务层，封装数据库和外部服务访问
- `src/types`：输入输出类型、Action 返回类型、业务 DTO
- `src/prisma/schema.prisma`：Prisma Schema
- 新增代码优先放入既有分层，不要随意创建平行目录

## 3. 编码规范

- 默认使用 TypeScript 严格类型，禁止滥用 `any`
- 命名清晰、语义明确，避免无意义缩写
- 函数保持单一职责，复杂逻辑拆分为小函数
- 优先写可读代码，不做炫技式抽象
- 仅在“为什么这样做”不明显时添加简短注释
- 统一使用项目现有工具函数和类型定义，避免重复实现

## 4. Server Component / Client Component 使用规则

- 默认使用 Server Component
- 只有在需要浏览器事件、状态、生命周期、`usePathname`、`useRouter` 等客户端能力时才使用 Client Component
- Client Component 必须显式添加 `"use client"`
- 不要把服务端密钥、数据库访问或敏感逻辑放入 Client Component
- 布局和数据读取优先放在服务端，交互局部下沉到客户端组件

## 5. Server Actions 使用规则

- Server Actions 统一放在 `src/actions`
- 文件顶部显式添加 `"use server"`
- Action 返回值统一使用 `ActionResult<T>`
- Action 负责参数校验、权限校验和调用服务层，不直接堆积复杂业务逻辑
- 可复用逻辑优先下沉到 `src/services`

## 6. Prisma 使用规则

- Prisma Client 统一从 `src/lib/prisma.ts` 引入，禁止重复实例化
- 所有数据库访问优先通过 `src/services` 封装，不要在页面组件中直接写复杂 Prisma 查询
- 修改数据模型时，先更新 `src/prisma/schema.prisma`，再执行迁移
- 查询时优先只选择必要字段，避免无意义全量读取
- 删除和更新操作必须考虑关联关系与空值情况

## 7. Clerk Auth 使用规则

- 鉴权统一基于 Clerk
- 服务端鉴权优先使用 `auth()` 和项目内封装的 `requireAuth()`
- 当前用户与本地 `User` 的同步逻辑统一放在 `src/services/user.service.ts`
- 受保护路由通过 `middleware.ts` 和应用布局共同兜底
- 未登录用户访问受保护页面时，应重定向到 `/sign-in`

## 8. 环境变量安全规则

- 所有密钥和敏感配置只能从环境变量读取
- 绝不在客户端暴露 `OPENAI_API_KEY`、`STRIPE_SECRET_KEY`、数据库连接串等敏感信息
- 只有需要暴露给浏览器的变量才使用 `NEXT_PUBLIC_` 前缀
- 新增环境变量时，同时更新 `.env.example` 或相关示例文件
- 不要在代码、日志或示例中写入真实密钥

## 9. 错误处理规则

- 统一返回明确、可诊断的错误信息
- 预期内错误优先返回结构化错误结果，不要直接吞掉异常
- 权限错误、参数错误、额度错误、外部服务错误应区分处理
- 对外部服务调用失败要保留必要上下文，但不要泄露敏感信息
- 用户可见错误保持简洁，内部错误保留足够调试信息

## 10. 后续实现接口时的约束

- 先定义输入输出类型，再实现业务逻辑
- 所有写接口必须做鉴权和基础参数校验
- OpenAI、Stripe、Prisma 调用分别走 `src/lib` 和 `src/services`，不要在路由里直接拼接大段逻辑
- 生成、文档、模板、账单、用量相关逻辑按业务域拆分，不要写成单体文件
- 新接口优先兼容当前目录结构与类型约定，不破坏既有分层
- 占位页、占位接口后续替换为真实逻辑时，保持路径和导出稳定，减少无谓重构
