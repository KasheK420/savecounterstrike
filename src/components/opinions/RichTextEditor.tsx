"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Share your thoughts...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] p-4 focus:outline-none prose prose-invert prose-sm max-w-none prose-headings:font-heading prose-a:text-cs-orange",
      },
    },
  });

  if (!editor) return null;

  function addImage() {
    const url = prompt("Enter image URL:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }

  function addLink() {
    const url = prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  const btnClass =
    "h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50";
  const activeClass = "text-cs-orange bg-cs-orange/10";

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-border/50 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${btnClass} ${editor.isActive("bold") ? activeClass : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${btnClass} ${editor.isActive("italic") ? activeClass : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border/50 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${btnClass} ${editor.isActive("heading", { level: 2 }) ? activeClass : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${btnClass} ${editor.isActive("heading", { level: 3 }) ? activeClass : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border/50 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${btnClass} ${editor.isActive("bulletList") ? activeClass : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${btnClass} ${editor.isActive("orderedList") ? activeClass : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${btnClass} ${editor.isActive("blockquote") ? activeClass : ""}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border/50 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btnClass}
          onClick={addLink}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btnClass}
          onClick={addImage}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border/50 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btnClass}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btnClass}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
