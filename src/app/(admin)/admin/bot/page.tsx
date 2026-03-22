"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bot,
  RefreshCw,
  Users,
  ShieldAlert,
  Upload,
  Activity,
  Send,
  Flag,
} from "lucide-react";

interface BotStatus {
  heartbeat: {
    timestamp: string;
    gcConnected: boolean;
    trackedCount: number;
    lastProfileCheck: string | null;
    lastBanCheck: string | null;
  } | null;
  trackedCount: number;
  bannedCount: number;
  recentCommands: {
    id: string;
    command: string;
    status: string;
    result: unknown;
    createdAt: string;
  }[];
}

interface TrackedPlayer {
  id: string;
  steamId: string;
  displayName: string | null;
  premierRating: number | null;
  vacBanned: boolean;
  numberOfGameBans: number;
  source: string;
  flagged: boolean;
  banCheckedAt: string | null;
  profileCheckedAt: string | null;
}

function timeAgo(date: string | null): string {
  if (!date) return "Never";
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function AdminBotPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [players, setPlayers] = useState<TrackedPlayer[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [playerFilter, setPlayerFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const [importIds, setImportIds] = useState("");
  const [guardCode, setGuardCode] = useState("");
  const [sending, setSending] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/admin/bot/status");
    if (res.ok) setStatus(await res.json());
  }, []);

  const fetchPlayers = useCallback(async () => {
    const params = new URLSearchParams();
    if (playerFilter !== "all") params.set("filter", playerFilter);
    const res = await fetch(`/api/admin/bot/players?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPlayers(data.players);
      setPlayerTotal(data.total);
    }
  }, [playerFilter]);

  useEffect(() => {
    fetchStatus();
    fetchPlayers();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchPlayers]);

  async function sendCommand(command: string, payload?: unknown) {
    setSending(true);
    try {
      await fetch("/api/admin/bot/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, payload }),
      });
      setTimeout(fetchStatus, 2000);
    } finally {
      setSending(false);
    }
  }

  async function submitGuardCode() {
    if (!guardCode) return;
    await fetch("/api/admin/bot/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamGuardCode: guardCode }),
    });
    setGuardCode("");
    alert("Steam Guard code sent to bot");
  }

  async function importPlayers() {
    const steamIds = importIds
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{17}$/.test(s));

    if (steamIds.length === 0) {
      alert("No valid Steam64 IDs found");
      return;
    }

    setImporting(true);
    await sendCommand("import_players", {
      steamIds,
      source: "leaderboard",
    });
    setImportIds("");
    setImporting(false);
    alert(`Queued import of ${steamIds.length} players`);
    setTimeout(fetchPlayers, 5000);
  }

  const heartbeat = status?.heartbeat;
  const isOnline =
    heartbeat &&
    Date.now() - new Date(heartbeat.timestamp).getTime() < 120000;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          GC Bot Control
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the CS2 Game Coordinator bot for leaderboard &amp; ban tracking
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cs-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Status
            </span>
            <Activity
              className={`h-4 w-4 ${isOnline ? "text-cs-green" : "text-red-500"}`}
            />
          </div>
          <div
            className={`text-lg font-bold ${isOnline ? "text-cs-green" : "text-red-500"}`}
          >
            {isOnline ? "Online" : "Offline"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {heartbeat ? timeAgo(heartbeat.timestamp) : "No heartbeat"}
          </p>
        </div>

        <div className="cs-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              GC
            </span>
            <Bot className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-foreground">
            {heartbeat?.gcConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        <div className="cs-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Tracked
            </span>
            <Users className="h-4 w-4 text-cs-orange" />
          </div>
          <div className="text-lg font-bold text-foreground">
            {status?.trackedCount.toLocaleString() ?? 0}
          </div>
        </div>

        <div className="cs-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              VAC Banned
            </span>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-lg font-bold text-red-500">
            {status?.bannedCount.toLocaleString() ?? 0}
          </div>
        </div>
      </div>

      {/* Steam Guard Code */}
      <div className="cs-card rounded-lg p-4">
        <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Steam Guard Code
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={guardCode}
            onChange={(e) => setGuardCode(e.target.value.toUpperCase())}
            placeholder="Enter email code (e.g. ABCDE)"
            maxLength={5}
            className="flex-1 rounded-md border border-border/50 bg-background px-3 py-2 text-sm font-mono uppercase tracking-widest"
          />
          <button
            onClick={submitGuardCode}
            disabled={!guardCode}
            className="px-4 py-2 rounded-lg bg-cs-orange text-black font-medium text-sm hover:bg-cs-orange/90 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Only needed if bot requires re-authentication
        </p>
      </div>

      {/* Actions */}
      <div className="cs-card rounded-lg p-4 space-y-4">
        <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
          Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => sendCommand("sync_signers")}
            disabled={sending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cs-green/15 text-cs-green text-sm font-medium hover:bg-cs-green/25 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Petition Signers
          </button>
        </div>
      </div>

      {/* Import Players */}
      <div className="cs-card rounded-lg p-4 space-y-3">
        <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
          Import Players (Steam64 IDs)
        </h3>
        <textarea
          value={importIds}
          onChange={(e) => setImportIds(e.target.value)}
          placeholder="Paste Steam64 IDs (one per line, comma-separated, or space-separated)&#10;e.g. 76561198199051397&#10;76561198000000000"
          rows={4}
          className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm font-mono"
        />
        <button
          onClick={importPlayers}
          disabled={importing || !importIds.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cs-orange text-black font-medium text-sm hover:bg-cs-orange/90 transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {importing ? "Importing..." : "Import Players"}
        </button>
      </div>

      {/* Tracked Players */}
      <div className="cs-card rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
            Tracked Players ({playerTotal})
          </h3>
          <div className="flex gap-1">
            {["all", "banned", "flagged"].map((f) => (
              <button
                key={f}
                onClick={() => setPlayerFilter(f)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  playerFilter === f
                    ? "bg-cs-orange/15 text-cs-orange"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left p-3">Player</th>
                <th className="text-left p-3">Steam ID</th>
                <th className="text-right p-3">Premier</th>
                <th className="text-center p-3">Status</th>
                <th className="text-left p-3">Source</th>
                <th className="text-right p-3">Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {players.map((p) => (
                <tr
                  key={p.id}
                  className={
                    p.vacBanned
                      ? "bg-red-500/5"
                      : p.flagged
                        ? "bg-yellow-500/5"
                        : ""
                  }
                >
                  <td className="p-3 font-medium">
                    {p.displayName || "—"}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {p.steamId}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {p.premierRating?.toLocaleString() ?? "—"}
                  </td>
                  <td className="p-3 text-center">
                    {p.vacBanned ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-500">
                        VAC
                      </span>
                    ) : p.numberOfGameBans > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/15 text-yellow-500">
                        GAME
                      </span>
                    ) : p.flagged ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/15 text-yellow-500">
                        <Flag className="h-2.5 w-2.5" /> FISHY
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Clean
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.source}
                  </td>
                  <td className="p-3 text-right text-xs text-muted-foreground">
                    {timeAgo(p.banCheckedAt)}
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No tracked players yet. Sync signers or import IDs above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Commands */}
      {status?.recentCommands && status.recentCommands.length > 0 && (
        <div className="cs-card rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
              Recent Commands
            </h3>
          </div>
          <div className="divide-y divide-border/20">
            {status.recentCommands.map((cmd) => (
              <div key={cmd.id} className="flex items-center gap-3 p-3">
                <Send className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-mono">{cmd.command}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cmd.status === "done"
                      ? "bg-green-500/15 text-green-500"
                      : cmd.status === "error"
                        ? "bg-red-500/15 text-red-500"
                        : cmd.status === "processing"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cmd.status}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {timeAgo(cmd.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
