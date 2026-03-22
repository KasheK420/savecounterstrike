/**
 * @fileoverview TipTap extension for Twitter/X embeds.
 *
 * Provides a custom node for embedding tweets in the editor.
 * The actual embed is rendered client-side via Twitter's widgets.js.
 *
 * @module tiptap/twitter-embed
 * @see {@link https://tiptap.dev/docs/editor/extensions/custom-extensions|TipTap Custom Extensions}
 */

import { Node, mergeAttributes } from "@tiptap/core";

/** Configuration options for TwitterEmbed */
export interface TwitterEmbedOptions {
  /** Additional HTML attributes for the rendered element */
  HTMLAttributes: Record<string, string>;
}

/** Extend TipTap commands type definitions */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twitterEmbed: {
      /** Insert a Twitter/X embed at current cursor position */
      setTwitterEmbed: (options: { url: string }) => ReturnType;
    };
  }
}

/**
 * TipTap node extension for Twitter/X embeds.
 * Stores the tweet URL and renders a placeholder in the editor.
 */
export const TwitterEmbed = Node.create<TwitterEmbedOptions>({
  name: "twitterEmbed",
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

  /** Parse Twitter embed from HTML (for hydration/pasting) */
  parseHTML() {
    return [{ tag: 'div[data-twitter-embed]', getAttrs: (el) => {
      const element = el as HTMLElement;
      return { url: element.getAttribute("data-twitter-embed") };
    }}];
  },

  /** Render node to HTML (placeholder display) */
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-twitter-embed": HTMLAttributes.url,
        class: "twitter-embed-placeholder",
      }),
      [
        "div",
        { class: "embed-preview" },
        `🐦 X/Twitter: ${HTMLAttributes.url || ""}`,
      ],
    ];
  },

  /** Add editor commands */
  addCommands() {
    return {
      setTwitterEmbed:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});
