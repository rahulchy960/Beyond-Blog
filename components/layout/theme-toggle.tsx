"use client";

import { MonitorCogIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_ITEMS = [
  {
    label: "Light",
    value: "light",
    icon: SunIcon,
  },
  {
    label: "Dark",
    value: "dark",
    icon: MoonIcon,
  },
  {
    label: "System",
    value: "system",
    icon: MonitorCogIcon,
  },
] as const;

const subscribe = () => () => undefined;

type ThemeToggleProps = {
  title?: string;
};

export function ThemeToggle({ title = "Toggle theme" }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const activeTheme = isClient ? theme : "system";

  const ActiveIcon = activeTheme === "light" ? SunIcon : activeTheme === "dark" ? MoonIcon : MonitorCogIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "focus-ring")}
        aria-label={title}
        title={title}
      >
          <ActiveIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {THEME_ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.value}
            className="flex items-center justify-between"
            onClick={() => setTheme(item.value)}
          >
            <span>{item.label}</span>
            <item.icon className="size-4" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
