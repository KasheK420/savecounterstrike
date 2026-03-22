"use client";

import { useState, useRef } from "react";
import { Upload, Link2, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  compact?: boolean;
}

const MAX_SIZE = 500 * 1024; // 500KB

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  compact = false,
}: ImageUploadProps) {
  const [mode, setMode] = useState<"upload" | "url">(value && value.startsWith("http") ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Must be an image file");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError(`File too large (${(file.size / 1024).toFixed(0)}KB). Max 500KB.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL or upload..."
            className="bg-muted/30 border-border text-xs flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
        {error && <p className="text-[10px] text-cs-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Mode tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-md p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
            mode === "upload"
              ? "bg-cs-orange/15 text-cs-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
            mode === "url"
              ? "bg-cs-orange/15 text-cs-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-3 w-3" />
          URL
        </button>
      </div>

      {mode === "url" ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="bg-muted/30 border-border text-sm"
        />
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-cs-orange bg-cs-orange/5"
              : "border-border/50 hover:border-border"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-cs-orange animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              <span className="text-sm text-muted-foreground">
                Drop an image here or click to browse
              </span>
              <span className="text-xs text-muted-foreground/50">
                Max 500KB &middot; JPEG, PNG, GIF, WebP
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-cs-red">{error}</p>
      )}

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-16 w-auto rounded border border-border/30 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-cs-red text-white text-xs"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
