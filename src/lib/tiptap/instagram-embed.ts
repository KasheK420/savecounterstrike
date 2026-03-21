import { Node, mergeAttributes } from "@tiptap/core";

export interface InstagramEmbedOptions {
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    instagramEmbed: {
      setInstagramEmbed: (options: { url: string }) => ReturnType;
    };
  }
}

export const InstagramEmbed = Node.create<InstagramEmbedOptions>({
  name: "instagramEmbed",
  group: "block",
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      url: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-instagram-embed]', getAttrs: (el) => {
      const element = el as HTMLElement;
      return { url: element.getAttribute("data-instagram-embed") };
    }}];
  },

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
