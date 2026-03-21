"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function SteamLoginButton() {
  return (
    <Link
      href="/api/auth/steam/login"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "border-cs-orange/30 text-cs-orange hover:bg-cs-orange hover:text-background transition-all"
      )}
    >
      <LogIn className="h-4 w-4 mr-2" />
      Sign in via Steam
    </Link>
  );
}
