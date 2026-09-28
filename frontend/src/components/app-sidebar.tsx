"use client";

import * as React from "react";
import {
  Award,
  AudioLines,
  Command,
  FilePlus,
  House,
  Send,
  Settings,
  Store,
  Users,
} from "lucide-react";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { StreakIndicator } from "@/components/streak-indicator";
import { FriendRequestBadge } from "@/components/friend-request-badge";
import { SubmitFeedbackButton } from "@/components/submit-feedback-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ModeSwitcher } from "@/components/mode-switcher";

const data = {
  projects: [
    { name: "Home", url: "/home", icon: House },
    { name: "Friends", url: "/friends", icon: Users, badge: <FriendRequestBadge /> },
    { name: "Marketplace", url: "/marketplace", icon: Store },
    { name: "Achievements", url: "/achievements", icon: Award },
    { name: "Edit Profile", url: "/edit-profile", icon: Settings },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    profilePicture?: string | null;
  };
};

export function AppSidebar({ ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {siteConfig.name}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
        {/* Not a page link (there's no /feedback route) - this opens the same feedback
            popover/form as the standalone "Submit Feedback" button elsewhere, just with a
            trigger styled to match the other nav items. */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SubmitFeedbackButton
                  trigger={
                    <SidebarMenuButton size="sm">
                      <Send />
                      <span>Feedback</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 w-full">
          <StreakIndicator />
          <ModeSwitcher />
          <NavUser user={props.user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
