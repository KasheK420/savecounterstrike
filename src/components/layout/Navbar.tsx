"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { SteamLoginButton } from "@/components/auth/SteamLoginButton";
import { UserAvatar } from "@/components/auth/UserAvatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Shield, BookOpen, Video, MessageSquare, BarChart3, DollarSign, Info, Heart } from "lucide-react";

const navLinks = [
  { href: "/petition", label: "Petition", icon: Shield },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/media", label: "Media", icon: Video },
  { href: "/opinions", label: "Opinions", icon: MessageSquare },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/about", label: "About", icon: Info },
];

export function Navbar() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-xl font-bold tracking-wider"
          >
            <span className="text-cs-orange">SAVE</span>
            <span className="text-foreground">CS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-cs-orange transition-colors rounded-md hover:bg-muted/50"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth + Support */}
          <div className="flex items-center gap-3">
            <Link
              href="/support"
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-cs-red transition-colors rounded-md"
              title="Support Us"
            >
              <Heart className="h-3.5 w-3.5" />
            </Link>
            {user ? <UserAvatar /> : <SteamLoginButton />}

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="md:hidden p-2 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 bg-background border-border"
              >
                <SheetTitle className="font-heading text-lg text-cs-orange">
                  Navigation
                </SheetTitle>
                <div className="flex flex-col gap-1 mt-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-cs-orange hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
