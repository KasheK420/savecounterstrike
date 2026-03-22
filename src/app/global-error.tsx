"use client";

/**
 * @fileoverview Global error boundary for root-level errors.
 *
 * Handles catastrophic errors that prevent the root layout from rendering.
 * Uses inline styles to ensure it displays even if CSS fails to load.
 *
 * @module app/global-error
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts|Next.js Global Error}
 */

/**
 * Global error fallback for root layout failures.
 *
 * @param error - The root-level error
 * @param reset - Function to retry rendering
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 500, padding: "2rem" }}>
          <div
            style={{
              fontSize: "4rem",
              fontWeight: 700,
              color: "#ff4444",
              marginBottom: "1rem",
              letterSpacing: "0.05em",
            }}
          >
            CRITICAL ERROR
          </div>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#737373",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            The whole server got Overwatch banned. Something catastrophic
            happened — we&apos;re working on it.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#de9b35",
              color: "#0a0a0a",
              border: "none",
              padding: "0.75rem 2rem",
              fontSize: "1rem",
              fontWeight: 700,
              borderRadius: "0.5rem",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            TRY AGAIN
          </button>
          <p
            style={{
              fontSize: "0.7rem",
              color: "#737373",
              marginTop: "2rem",
              opacity: 0.5,
            }}
          >
            savecounterstrike.com
            {error.digest ? ` · ${error.digest}` : ""}
          </p>
        </div>
      </body>
    </html>
  );
}
