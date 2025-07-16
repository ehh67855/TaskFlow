import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { Plus } from "lucide-react";
import Link from "next/link";

export function NewProjectButton() {
  return (
    <Link href="/new-project">
      <MovingBorderButton
        borderRadius="1.25rem"
        className="bg-white dark:bg-black text-black dark:text-white border-neutral-200 dark:border-slate-800 flex flex-row gap-2 items-center"
        containerClassName=""
      >
        <Plus className="size-4" />
        Add Project
      </MovingBorderButton>
    </Link>
  );
}
