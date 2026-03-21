"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface SupporterItem {
  name: string;
  logoUrl: string;
  url?: string;
}

export function SupportersAdmin({
  initialItems,
}: {
  initialItems: SupporterItem[];
}) {
  const [items, setItems] = useState<SupporterItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addItem() {
    setItems((prev) => [...prev, { name: "", logoUrl: "", url: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof SupporterItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const filtered = items.filter((i) => i.name && i.logoUrl);
      await fetch("/api/supporters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: filtered }),
      });
      setItems(filtered);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add logos and names of supporters. They&apos;ll scroll across the
        homepage in a semi-transparent slider.
      </p>

      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <Input
            value={item.name}
            onChange={(e) => updateItem(i, "name", e.target.value)}
            placeholder="Name"
            className="bg-muted/30 border-border w-36 text-sm"
          />
          <div className="flex-1 min-w-[200px]">
            <ImageUpload
              value={item.logoUrl}
              onChange={(url) => updateItem(i, "logoUrl", url)}
              compact
            />
          </div>
          <Input
            value={item.url || ""}
            onChange={(e) => updateItem(i, "url", e.target.value)}
            placeholder="Link URL (optional)"
            className="bg-muted/30 border-border w-48 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(i)}
            className="text-cs-red hover:bg-cs-red/10 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Supporter
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-cs-orange hover:bg-cs-orange-light text-background text-xs"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>
    </div>
  );
}
