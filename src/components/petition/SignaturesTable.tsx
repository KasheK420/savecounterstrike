"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MaskedSignature {
  id: string;
  maskedName: string;
  maskedSteamId: string;
  signedAt: string;
  message: string | null;
}

interface PageData {
  signatures: MaskedSignature[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}

export function SignaturesTable() {
  const [data, setData] = useState<PageData | null>(null);
  const [page, setPage] = useState(1);
  const [fetched, setFetched] = useState(false);
  const loading = !fetched || (data !== null && data.page !== page);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/signatures?page=${page}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setFetched(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFetched(true);
      });
    return () => controller.abort();
  }, [page]);

  if (loading && !data) {
    return (
      <div className="cs-card rounded-xl p-8 text-center text-muted-foreground">
        Loading signatures...
      </div>
    );
  }

  if (!data || data.signatures.length === 0) {
    return (
      <div className="cs-card rounded-xl p-8 text-center text-muted-foreground">
        No signatures yet. Be the first to sign!
      </div>
    );
  }

  const startIndex = (data.page - 1) * data.pageSize;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground text-center">
        {data.total.toLocaleString()} total signatures
      </div>

      <div className="cs-card rounded-xl overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-[3rem_1fr_1fr_7rem_1fr] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>#</span>
          <span>Name</span>
          <span>Steam ID</span>
          <span>Date</span>
          <span>Message</span>
        </div>

        {/* Rows */}
        <div className={`divide-y divide-border/50 ${loading ? "opacity-50" : ""}`}>
          {data.signatures.map((sig, i) => (
            <div
              key={sig.id}
              className="grid grid-cols-1 sm:grid-cols-[3rem_1fr_1fr_7rem_1fr] gap-2 sm:gap-4 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
            >
              <span className="text-muted-foreground text-xs tabular-nums hidden sm:block">
                {startIndex + i + 1}
              </span>
              <span className="text-foreground font-medium font-mono text-xs">
                {sig.maskedName}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {sig.maskedSteamId}
              </span>
              <span className="text-muted-foreground text-xs">
                {new Date(sig.signedAt).toLocaleDateString()}
              </span>
              <span className="text-muted-foreground text-xs truncate">
                {sig.message ? `"${sig.message}"` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={data.page <= 1 || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={data.page >= data.totalPages || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
