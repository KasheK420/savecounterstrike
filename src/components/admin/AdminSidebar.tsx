"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  BarChart3,
  Users,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/opinions", label: "Opinions", icon: MessageSquare },
  { href: "/admin/petitions", label: "Petitions", icon: ScrollText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/stats", label: "Stats", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border/50 bg-card/50 min-h-screen p-4 hidden lg:block">
      <div className="mb-8">
        <Link href="/admin" className="font-heading text-lg font-bold tracking-wider">
          <span className="text-cs-orange">SAVE</span>
          <span className="text-foreground">CS</span>
          <span className="text-muted-foreground text-xs ml-2 font-normal">
            Admin
          </span>
        </Link>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors",
                active
                  ? "bg-cs-orange/10 text-cs-orange border border-cs-orange/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-t border-border/30">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
