"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { OpinionCard } from "@/components/opinions/OpinionCard";
import { OpinionForm } from "@/components/opinions/OpinionForm";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, TrendingUp, Clock, MessagesSquare } from "lucide-react";

interface OpinionData {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  score: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    ownsCs2?: boolean | null;
    cs2PlaytimeHours?: number | null;
    cs2Wins?: number | null;
    faceitLevel?: number | null;
    profileVisibility?: number | null;
  };
  _count: { comments: number };
}

const SORT_OPTIONS = [
  { key: "best", label: "Best", icon: TrendingUp },
  { key: "newest", label: "Newest", icon: Clock },
  { key: "discussed", label: "Most Discussed", icon: MessagesSquare },
];

export default function OpinionsPage() {
  const searchParams = useSearchParams();
  const [opinions, setOpinions] = useState<OpinionData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(searchParams.get("sort") || "best");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const fetchOpinions = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        page: String(pageNum),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/opinions?${params}`);
      const data = await res.json();
      if (pageNum === 1) {
        setOpinions(data.opinions);
      } else {
        setOpinions((prev) => [...prev, ...data.opinions]);
      }
      setTotal(data.total);
      setPage(pageNum);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [sort, search]);

  useEffect(() => {
    fetchOpinions(1);
  }, [fetchOpinions]);

  function handleSortChange(newSort: string) {
    setSort(newSort);
    setPage(1);
  }

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold">
            OPINIONS &{" "}
            <span className="text-cs-gold">SUGGESTIONS</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-3 max-w-2xl mx-auto">
            Share what Valve needs to fix. Vote on what matters most. The
            top-voted opinions go into our open letter.
          </p>
        </div>

        {/* Submit toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-cs-orange hover:text-cs-orange-light transition-colors"
          >
            {showForm ? "Cancel" : "+ Submit your opinion"}
          </button>
          {showForm && (
            <div className="mt-4">
              <OpinionForm />
            </div>
          )}
        </div>

        {/* Sort + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSortChange(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading transition-colors ${
                  sort === opt.key
                    ? "bg-cs-orange/15 text-cs-orange"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search opinions..."
              className="pl-9 bg-muted/30 border-border h-9 text-sm"
            />
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-4">
          {total} opinion{total !== 1 ? "s" : ""}
        </p>

        {/* Opinion list */}
        <div className="space-y-3">
          {opinions.map((opinion) => (
            <OpinionCard key={opinion.id} opinion={opinion} />
          ))}

          {loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Loading...
            </div>
          )}

          {!loading && opinions.length === 0 && (
            <div className="cs-card rounded-lg p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search
                  ? "No opinions match your search."
                  : "No opinions yet. Be the first to share yours!"}
              </p>
            </div>
          )}

          {!loading && opinions.length < total && (
            <button
              onClick={() => fetchOpinions(page + 1)}
              className="w-full py-3 text-sm text-cs-orange hover:text-cs-orange-light transition-colors cs-card rounded-lg"
            >
              Load more opinions...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
