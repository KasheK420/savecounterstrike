"use client";

/**
 * @fileoverview Error boundary component for route-level errors.
 *
 * Catches and displays errors that occur during rendering.
 * Provides retry and navigation options.
 *
 * @module app/error
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/error-handling|Next.js Error Handling}
 */

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Error boundary component for handling route errors.
 *
 * @param error - The error that occurred
 * @param reset - Function to retry rendering
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error for monitoring
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <AlertTriangle className="h-20 w-20 text-cs-red/60 mx-auto" />

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          SOMETHING <span className="text-cs-red">BROKE</span>
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed">
          Even VAC couldn&apos;t prevent this one. Something went wrong on our
          end — not your fault, we promise.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={reset}
            size="lg"
            className="bg-cs-orange hover:bg-cs-orange-light text-background font-heading"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground/40 pt-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
