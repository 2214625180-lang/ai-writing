import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "AI 写作助手",
  description: "基于 Next.js、Clerk、Prisma 和 OpenAI 的 AI 写作 SaaS 项目。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="zh-CN">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
