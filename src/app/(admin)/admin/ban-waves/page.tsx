"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Radio } from "lucide-react";

interface BanWave {
  id: string;
  date: string;
  title: string;
  description: string | null;
  estimatedBans: number | null;
  source: string | null;
}

export default function AdminBanWavesPage() {
  const [banWaves, setBanWaves] = useState<BanWave[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    estimatedBans: "",
    source: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanWaves();
  }, []);

  async function fetchBanWaves() {
    const res = await fetch("/api/admin/ban-waves");
    if (res.ok) setBanWaves(await res.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ban-waves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          title: form.title,
          description: form.description || undefined,
          estimatedBans: form.estimatedBans
            ? parseInt(form.estimatedBans)
            : undefined,
          source: form.source || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({
          date: new Date().toISOString().split("T")[0],
          title: "",
          description: "",
          estimatedBans: "",
          source: "",
        });
        fetchBanWaves();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ban wave entry?")) return;
    const res = await fetch(`/api/admin/ban-waves?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchBanWaves();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Ban Waves
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log known VAC/game ban waves from community sources
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cs-orange text-black font-medium text-sm hover:bg-cs-orange/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Ban Wave
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="cs-card rounded-lg p-6 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. March 2026 VAC Wave"
                className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Details about the ban wave..."
              rows={3}
              className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Estimated Bans
              </label>
              <input
                type="number"
                value={form.estimatedBans}
                onChange={(e) =>
                  setForm({ ...form, estimatedBans: e.target.value })
                }
                placeholder="e.g. 50000"
                className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Source URL
              </label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. https://reddit.com/r/..."
                className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-cs-green text-black font-medium text-sm hover:bg-cs-green/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="cs-card rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
            Logged Ban Waves ({banWaves.length})
          </h3>
        </div>
        <div className="divide-y divide-border/20">
          {banWaves.map((wave: typeof banWaves[0]) => (
            <div key={wave.id} className="flex items-start gap-3 p-4">
              <Radio className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {wave.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(wave.date).toLocaleDateString()}
                  </span>
                  {wave.estimatedBans && (
                    <span className="text-xs text-red-400 font-medium">
                      ~{wave.estimatedBans.toLocaleString()} bans
                    </span>
                  )}
                </div>
                {wave.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {wave.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(wave.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {banWaves.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No ban waves logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
