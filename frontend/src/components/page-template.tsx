import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { ModeSwitcher } from "./mode-switcher";
import { LucideIcon } from "lucide-react";

export function PageTemplate(
  props: RootLayoutProps & {
    name: string;
    className?: string;
    rightSide?: React.ReactNode;
  }
) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex flex-row justify-between w-full pr-4">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {
                      `${props.name} Page`
                    }
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-row items-center gap-2">
            {props.rightSide}
            <ModeSwitcher />
          </div>
        </div>
      </header>
      <div className={cn("p-4", props.className)}>
        <h1 className="text-3xl font-bold text-center mb-8">{props.name}</h1>
        {props.children}
      </div>
    </>
  );
}
