"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { TwitterEmbed } from "@/lib/tiptap/twitter-embed";
import { InstagramEmbed } from "@/lib/tiptap/instagram-embed";
import { useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  ImageIcon,
  Youtube as YoutubeIcon,
  Twitter,
  Instagram,
  Unlink,
} from "lucide-react";
import "./tiptap-editor.css";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [embedDialog, setEmbedDialog] = useState<{
    type: "link" | "image" | "youtube" | "twitter" | "instagram";
    open: boolean;
  }>({ type: "link", open: false });
  const [embedUrl, setEmbedUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ controls: true, nocookie: true }),
      Placeholder.configure({ placeholder: "Write your article..." }),
      TwitterEmbed,
      InstagramEmbed,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  const openDialog = useCallback(
    (type: "link" | "image" | "youtube" | "twitter" | "instagram") => {
      // For link, pre-fill with current selection's link
      if (type === "link" && editor) {
        const existing = editor.getAttributes("link").href || "";
        setEmbedUrl(existing);
      } else {
        setEmbedUrl("");
      }
      setEmbedDialog({ type, open: true });
    },
    [editor]
  );

  const handleEmbedSubmit = useCallback(() => {
    if (!editor || !embedUrl.trim()) {
      setEmbedDialog((d) => ({ ...d, open: false }));
      return;
    }

    const url = embedUrl.trim();

    switch (embedDialog.type) {
      case "link":
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
        break;
      case "image":
        editor.chain().focus().setImage({ src: url }).run();
        break;
      case "youtube":
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
        break;
      case "twitter":
        editor.chain().focus().setTwitterEmbed({ url }).run();
        break;
      case "instagram":
        editor.chain().focus().setInstagramEmbed({ url }).run();
        break;
    }

    setEmbedUrl("");
    setEmbedDialog((d) => ({ ...d, open: false }));
  }, [editor, embedUrl, embedDialog.type]);

  if (!editor) return null;

  const dialogLabels: Record<string, { title: string; placeholder: string }> = {
    link: { title: "Insert Link", placeholder: "https://example.com" },
    image: { title: "Insert Image", placeholder: "https://example.com/image.jpg" },
    youtube: { title: "Embed YouTube", placeholder: "https://youtube.com/watch?v=..." },
    twitter: { title: "Embed X/Twitter", placeholder: "https://x.com/user/status/..." },
    instagram: { title: "Embed Instagram", placeholder: "https://instagram.com/p/..." },
  };

  return (
    <div className="tiptap-wrapper">
      {/* Toolbar */}
      <div className="tiptap-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="divider" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor.isActive("heading", { level: 2 }) ? "is-active" : ""
          }
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={
            editor.isActive("heading", { level: 3 }) ? "is-active" : ""
          }
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "is-active" : ""}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "is-active" : ""}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "is-active" : ""}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "is-active" : ""}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="divider" />

        <button
          type="button"
          onClick={() => openDialog("link")}
          className={editor.isActive("link") ? "is-active" : ""}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => openDialog("image")}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="divider" />

        <button
          type="button"
          onClick={() => openDialog("youtube")}
          className="embed-btn"
          title="Embed YouTube"
        >
          <YoutubeIcon className="h-3.5 w-3.5" />
          YT
        </button>
        <button
          type="button"
          onClick={() => openDialog("twitter")}
          className="embed-btn"
          title="Embed X/Twitter"
        >
          <Twitter className="h-3.5 w-3.5" />
          X
        </button>
        <button
          type="button"
          onClick={() => openDialog("instagram")}
          className="embed-btn"
          title="Embed Instagram"
        >
          <Instagram className="h-3.5 w-3.5" />
          IG
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* URL Input Dialog (inline) */}
      {embedDialog.open && (
        <div className="border-t border-border/50 bg-[hsl(0_0%_9%)] p-3 flex items-center gap-2">
          <span className="text-xs font-heading text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {dialogLabels[embedDialog.type]?.title}:
          </span>
          <input
            type="url"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEmbedSubmit();
              if (e.key === "Escape")
                setEmbedDialog((d) => ({ ...d, open: false }));
            }}
            placeholder={dialogLabels[embedDialog.type]?.placeholder}
            className="flex-1 bg-muted/50 border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cs-orange/40"
            autoFocus
          />
          <button
            type="button"
            onClick={handleEmbedSubmit}
            className="px-3 py-1.5 text-xs font-heading uppercase bg-cs-orange text-background rounded hover:bg-cs-orange-light transition-colors"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setEmbedDialog((d) => ({ ...d, open: false }))}
            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
