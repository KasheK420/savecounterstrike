"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
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
  Unlink,
} from "lucide-react";
import "./tiptap-editor.css";

interface SharedTiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function SharedTiptapEditor({
  content,
  onChange,
  placeholder = "Write something...",
  minHeight = "200px",
}: SharedTiptapEditorProps) {
  const [dialogType, setDialogType] = useState<"link" | "image" | null>(null);
  const [dialogUrl, setDialogUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  const openDialog = useCallback(
    (type: "link" | "image") => {
      if (type === "link" && editor) {
        setDialogUrl(editor.getAttributes("link").href || "");
      } else {
        setDialogUrl("");
      }
      setDialogType(type);
    },
    [editor]
  );

  const handleDialogSubmit = useCallback(() => {
    if (!editor || !dialogUrl.trim()) {
      setDialogType(null);
      return;
    }
    const url = dialogUrl.trim();
    if (dialogType === "link") {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else if (dialogType === "image") {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setDialogUrl("");
    setDialogType(null);
  }, [editor, dialogUrl, dialogType]);

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper">
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
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
      </div>

      <EditorContent editor={editor} />

      {dialogType && (
        <div className="border-t border-border/50 bg-[hsl(0_0%_9%)] p-3 flex items-center gap-2">
          <span className="text-xs font-heading text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {dialogType === "link" ? "Insert Link" : "Insert Image"}:
          </span>
          <input
            type="url"
            value={dialogUrl}
            onChange={(e) => setDialogUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleDialogSubmit();
              if (e.key === "Escape") setDialogType(null);
            }}
            placeholder={
              dialogType === "link"
                ? "https://example.com"
                : "https://example.com/image.jpg"
            }
            className="flex-1 bg-muted/50 border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cs-orange/40"
            autoFocus
          />
          <button
            type="button"
            onClick={handleDialogSubmit}
            className="px-3 py-1.5 text-xs font-heading uppercase bg-cs-orange text-background rounded hover:bg-cs-orange-light transition-colors"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setDialogType(null)}
            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
