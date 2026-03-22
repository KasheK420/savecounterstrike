/**
 * @fileoverview 404 Not Found page.
 *
 * Displayed when a route doesn't exist. Provides navigation back to
 * home and to the petition page.
 *
 * @module app/not-found
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/not-found|Next.js Not Found}
 */

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Crosshair, Home, Shield } from "lucide-react";

/**
 * 404 Not Found component.
 */
export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <div className="relative inline-block">
          <Crosshair className="h-24 w-24 text-cs-orange/20 mx-auto" />
          <span className="absolute inset-0 flex items-center justify-center font-heading text-5xl font-bold text-cs-orange cs-glow">
            404
          </span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          YOU <span className="text-cs-orange">WHIFFED</span>
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed">
          This page doesn&apos;t exist. Either you missed the shot, or Valve
          deleted it before we could save it.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-cs-orange hover:bg-cs-orange-light text-background font-heading"
            )}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <Link
            href="/petition"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4 mr-2" />
            Sign the Petition
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/40 pt-4">
          Error 404 &middot; savecounterstrike.com
        </p>
      </div>
    </div>
  );
}
