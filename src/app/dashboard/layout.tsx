import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUserProfile } from "@/lib/auth";
import { userService } from "@/services/user.service";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const profile = await getCurrentUserProfile();

  if (profile) {
    try {
      await userService.ensureUser({
        clerkUserId: profile.clerkUserId,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl
      });
    } catch (error) {
      console.error("Failed to synchronize authenticated user into Prisma.", error);
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
