import * as React from "react";
import { cn } from "@/lib/utils";

// 1. 在类型中增加 "outline"
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

// 2. 新增 ButtonSize 类型
type ButtonSize = "default" | "sm" | "lg";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-slate-800 focus-visible:outline-slate-900",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-slate-300 focus-visible:outline-slate-400",
  ghost:
    "bg-transparent text-foreground hover:bg-slate-100 focus-visible:outline-slate-300",
  // 3. 添加 outline 的具体 Tailwind 样式
  outline:
    "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-300",
};

// 4. 定义不同尺寸的样式映射
const buttonSizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-5", // 保留你原本的默认尺寸
  sm: "h-9 px-3 rounded-md", // 导航栏用的较小尺寸
  lg: "h-12 px-8 rounded-xl text-lg", // 落地页主视觉用的较大尺寸
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize; // 5. 在 Props 中暴露 size 属性
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          // 我把你原本写死在基础类里的 "h-11 px-5" 移到了上面的 size 映射中，
          // 其他基础样式保持不变
          "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariantClasses[variant],
          buttonSizeClasses[size], // 6. 应用尺寸样式
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";