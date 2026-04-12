import type { ComponentType } from "react";
import {
  BookOpenText,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  ImageIcon,
  LineChart,
  Layers3Icon,
  MessageSquare,
  ScrollText,
  Settings2,
  Sparkles,
  TagsIcon,
  ShapesIcon,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export const adminNavigation: AdminNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: Gauge },
  { title: "Analytics", href: "/admin/analytics", icon: LineChart },
  { title: "All Content", href: "/admin/content", icon: Layers3Icon },
  { title: "Journals", href: "/admin/journals", icon: BookOpenText },
  { title: "Articles", href: "/admin/articles", icon: FileText },
  { title: "Projects", href: "/admin/projects", icon: FolderKanban },
  { title: "Courses", href: "/admin/courses", icon: GraduationCap },
  { title: "Media Library", href: "/admin/media", icon: ImageIcon },
  { title: "Comments", href: "/admin/comments", icon: MessageSquare },
  { title: "Quizzes", href: "/admin/quizzes", icon: Sparkles },
  { title: "Categories", href: "/admin/categories", icon: ShapesIcon },
  { title: "Tags", href: "/admin/tags", icon: TagsIcon },
  { title: "Profile & Footer", href: "/admin/settings/profile", icon: Settings2 },
  { title: "SEO Settings", href: "/admin/settings/seo", icon: Settings2 },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
];

const adminTitleMap = new Map(adminNavigation.map((item) => [item.href, item.title]));

export function getAdminPageTitle(pathname: string) {
  if (adminTitleMap.has(pathname)) {
    return adminTitleMap.get(pathname) as string;
  }

  const fallback = adminNavigation.find(
    (item) => pathname.startsWith(item.href) && item.href !== "/admin",
  );

  return fallback?.title ?? "Admin";
}

