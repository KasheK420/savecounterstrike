import { Node, mergeAttributes } from "@tiptap/core";

export interface TwitterEmbedOptions {
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twitterEmbed: {
      setTwitterEmbed: (options: { url: string }) => ReturnType;
    };
  }
}

export const TwitterEmbed = Node.create<TwitterEmbedOptions>({
  name: "twitterEmbed",
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
    return [{ tag: 'div[data-twitter-embed]', getAttrs: (el) => {
      const element = el as HTMLElement;
      return { url: element.getAttribute("data-twitter-embed") };
    }}];
  },

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
