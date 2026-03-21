import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Articles",
  description: "Articles about the cheating epidemic in Counter-Strike 2.",
};

export default function ArticlesPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <FileText className="h-16 w-16 text-cs-orange mx-auto mb-6 opacity-50" />
        <h1 className="font-heading text-4xl font-bold mb-4">
          <span className="text-cs-orange">ARTICLES</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Coming soon. In-depth articles about the state of anti-cheat in CS2.
        </p>
      </div>
    </div>
  );
}
