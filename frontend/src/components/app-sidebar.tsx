"use client";

import * as React from "react";
import {
  AudioLines,
  Command,
  FilePlus,
  House,
  Send,
  Settings,
} from "lucide-react";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
    { name: "Edit Profile", url: "/edit-profile", icon: Settings },
  ],
  navSecondary: [{ title: "Feedback", url: "/feedback", icon: Send }],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 w-full">
          <ModeSwitcher />
          <NavUser user={props.user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
