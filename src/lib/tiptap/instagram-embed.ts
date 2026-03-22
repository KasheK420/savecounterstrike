/**
 * @fileoverview TipTap extension for Instagram embeds.
 *
 * Provides a custom node for embedding Instagram posts in the editor.
 * The actual embed is rendered client-side via Instagram's embed.js.
 *
 * @module tiptap/instagram-embed
 * @see {@link https://tiptap.dev/docs/editor/extensions/custom-extensions|TipTap Custom Extensions}
 */

import { Node, mergeAttributes } from "@tiptap/core";

/** Configuration options for InstagramEmbed */
export interface InstagramEmbedOptions {
  /** Additional HTML attributes for the rendered element */
  HTMLAttributes: Record<string, string>;
}

/** Extend TipTap commands type definitions */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    instagramEmbed: {
      /** Insert an Instagram embed at current cursor position */
      setInstagramEmbed: (options: { url: string }) => ReturnType;
    };
  }
}

/**
 * TipTap node extension for Instagram embeds.
 * Stores the Instagram URL and renders a placeholder in the editor.
 */
export const InstagramEmbed = Node.create<InstagramEmbedOptions>({
  name: "instagramEmbed",
  group: "block",
  atom: true, // Treat as single unit (no child content)

  /** Default options */
  addOptions() {
    return { HTMLAttributes: {} };
  },

  /** Node attributes (persisted in document) */
  addAttributes() {
    return {
      url: { default: null },
    };
  },

  /** Parse Instagram embed from HTML (for hydration/pasting) */
  parseHTML() {
    return [{ tag: 'div[data-instagram-embed]', getAttrs: (el) => {
      const element = el as HTMLElement;
      return { url: element.getAttribute("data-instagram-embed") };
    }}];
  },

  /** Render node to HTML (placeholder display) */
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-instagram-embed": HTMLAttributes.url,
        class: "instagram-embed-placeholder",
      }),
      [
        "div",
        { class: "embed-preview" },
        `📷 Instagram: ${HTMLAttributes.url || ""}`,
      ],
    ];
  },

  /** Add editor commands */
  addCommands() {
    return {
      setInstagramEmbed:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});
