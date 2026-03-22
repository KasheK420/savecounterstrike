"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Mail,
  MessageSquare,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string | null;
  socialUrl: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  emailBody: string | null;
  emailSent: boolean;
  sentAt: string | null;
  replied: boolean;
  repliedAt: string | null;
  engaged: boolean;
  notes: string | null;
  addToSupporters: boolean;
  addToNotable: boolean;
  createdAt: string;
}

const ROLES = [
  "Pro Player",
  "Organization",
  "Streamer",
  "YouTuber",
  "Media",
  "Platform",
  "Community",
  "Other",
];

const ROLE_COLORS: Record<string, string> = {
  "Pro Player": "text-cs-orange",
  Organization: "text-cs-blue",
  Streamer: "text-[#9146ff]",
  YouTuber: "text-cs-red",
  Media: "text-cs-green",
  Platform: "text-cs-gold",
  Community: "text-[#00bcd4]",
  Other: "text-muted-foreground",
};

export function OutreachTable() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // New contact form
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Other");
  const [newEmail, setNewEmail] = useState("");
  const [newSocial, setNewSocial] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchContacts() {
    try {
      const res = await fetch("/api/admin/outreach");
      if (res.ok) setContacts(await res.json());
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  async function addContact() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          role: newRole,
          email: newEmail || undefined,
          socialUrl: newSocial || undefined,
          websiteUrl: newWebsite || undefined,
          avatarUrl: newAvatar || undefined,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewEmail("");
        setNewSocial("");
        setNewWebsite("");
        setNewAvatar("");
        setShowAdd(false);
        fetchContacts();
        router.refresh();
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  async function toggleField(id: string, field: string, value: boolean) {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );

    await fetch(`/api/admin/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
  }

  async function updateField(id: string, field: string, value: string) {
    await fetch(`/api/admin/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/admin/outreach/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  const filtered = contacts.filter((c) => {
    if (filter !== "all") {
      if (filter === "sent" && !c.emailSent) return false;
      if (filter === "unsent" && c.emailSent) return false;
      if (filter === "replied" && !c.replied) return false;
      if (filter === "engaged" && !c.engaged) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-cs-orange mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button
          onClick={() => setShowAdd(!showAdd)}
          size="sm"
          className="bg-cs-orange hover:bg-cs-orange-light text-background text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Contact
        </Button>

        <div className="flex gap-1 bg-muted/30 rounded-md p-0.5">
          {["all", "unsent", "sent", "replied", "engaged"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filter === f
                  ? "bg-cs-orange/15 text-cs-orange"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-8 w-48 text-xs bg-muted/30 border-border"
        />

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} / {contacts.length}
        </span>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="cs-card rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name *"
              className="bg-muted/30 border-border text-sm"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="h-9 px-2 rounded-md border border-border bg-muted/30 text-sm text-foreground"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email"
              className="bg-muted/30 border-border text-sm"
            />
            <Input
              value={newSocial}
              onChange={(e) => setNewSocial(e.target.value)}
              placeholder="Social URL (Twitter etc)"
              className="bg-muted/30 border-border text-sm"
            />
            <Input
              value={newWebsite}
              onChange={(e) => setNewWebsite(e.target.value)}
              placeholder="Website URL"
              className="bg-muted/30 border-border text-sm"
            />
            <Input
              value={newAvatar}
              onChange={(e) => setNewAvatar(e.target.value)}
              placeholder="Avatar/Logo URL"
              className="bg-muted/30 border-border text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={addContact}
              disabled={saving || !newName.trim()}
              size="sm"
              className="bg-cs-orange hover:bg-cs-orange-light text-background text-xs"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Save
            </Button>
            <Button onClick={() => setShowAdd(false)} variant="ghost" size="sm" className="text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="cs-card rounded-lg overflow-hidden">
        <div className="divide-y divide-border/20">
          {filtered.map((contact) => {
            const expanded = expandedId === contact.id;
            return (
              <div key={contact.id} className="p-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {contact.avatarUrl && (
                    <img
                      src={contact.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover shrink-0 border border-border/30"
                    />
                  )}

                  {/* Name + role */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {contact.name}
                      </span>
                      <span className={`text-[10px] font-medium ${ROLE_COLORS[contact.role] || "text-muted-foreground"}`}>
                        {contact.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {contact.email || contact.socialUrl || "No contact"}
                    </div>
                  </div>

                  {/* Status toggles */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleField(contact.id, "emailSent", !contact.emailSent)}
                      className={`p-1.5 rounded transition-colors ${
                        contact.emailSent ? "text-cs-orange bg-cs-orange/10" : "text-muted-foreground/30 hover:text-muted-foreground"
                      }`}
                      title="Email Sent"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleField(contact.id, "replied", !contact.replied)}
                      className={`p-1.5 rounded transition-colors ${
                        contact.replied ? "text-cs-green bg-cs-green/10" : "text-muted-foreground/30 hover:text-muted-foreground"
                      }`}
                      title="Replied"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleField(contact.id, "engaged", !contact.engaged)}
                      className={`p-1.5 rounded transition-colors ${
                        contact.engaged ? "text-cs-gold bg-cs-gold/10" : "text-muted-foreground/30 hover:text-muted-foreground"
                      }`}
                      title="Engaged (shared/signed)"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>

                    <div className="w-px h-4 bg-border/30 mx-1" />

                    <button
                      onClick={() => toggleField(contact.id, "addToSupporters", !contact.addToSupporters)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors ${
                        contact.addToSupporters
                          ? "border-cs-blue/30 text-cs-blue bg-cs-blue/10"
                          : "border-border/30 text-muted-foreground/40 hover:text-muted-foreground"
                      }`}
                      title="Add to homepage supporters"
                    >
                      SUP
                    </button>
                    <button
                      onClick={() => toggleField(contact.id, "addToNotable", !contact.addToNotable)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors ${
                        contact.addToNotable
                          ? "border-cs-gold/30 text-cs-gold bg-cs-gold/10"
                          : "border-border/30 text-muted-foreground/40 hover:text-muted-foreground"
                      }`}
                      title="Add to notable signatures"
                    >
                      NOT
                    </button>

                    <button
                      onClick={() => setExpandedId(expanded ? null : contact.id)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        defaultValue={contact.email || ""}
                        onBlur={(e) => updateField(contact.id, "email", e.target.value)}
                        placeholder="Email"
                        className="bg-muted/20 border-border text-xs h-7"
                      />
                      <Input
                        defaultValue={contact.socialUrl || ""}
                        onBlur={(e) => updateField(contact.id, "socialUrl", e.target.value)}
                        placeholder="Social URL"
                        className="bg-muted/20 border-border text-xs h-7"
                      />
                      <Input
                        defaultValue={contact.websiteUrl || ""}
                        onBlur={(e) => updateField(contact.id, "websiteUrl", e.target.value)}
                        placeholder="Website URL"
                        className="bg-muted/20 border-border text-xs h-7"
                      />
                      <Input
                        defaultValue={contact.avatarUrl || ""}
                        onBlur={(e) => updateField(contact.id, "avatarUrl", e.target.value)}
                        placeholder="Avatar/Logo URL"
                        className="bg-muted/20 border-border text-xs h-7"
                      />
                    </div>
                    <Textarea
                      defaultValue={contact.emailBody || ""}
                      onBlur={(e) => updateField(contact.id, "emailBody", e.target.value)}
                      placeholder="Email body (paste what was sent)..."
                      rows={4}
                      className="bg-muted/20 border-border text-xs resize-y"
                    />
                    <Textarea
                      defaultValue={contact.notes || ""}
                      onBlur={(e) => updateField(contact.id, "notes", e.target.value)}
                      placeholder="Notes..."
                      rows={2}
                      className="bg-muted/20 border-border text-xs resize-y"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => deleteContact(contact.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs border-cs-red/30 text-cs-red hover:bg-cs-red/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {contacts.length === 0 ? "No contacts yet." : "No contacts match filter."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
