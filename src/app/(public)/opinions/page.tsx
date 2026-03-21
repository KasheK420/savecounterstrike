import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Community Opinions",
  description: "Share your opinion on CS2's cheating problem and vote on what matters.",
};

export default function OpinionsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <MessageSquare className="h-16 w-16 text-cs-gold mx-auto mb-6 opacity-50" />
        <h1 className="font-heading text-4xl font-bold mb-4">
          COMMUNITY <span className="text-cs-gold">OPINIONS</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Coming soon. Share your thoughts and vote on community discussions.
        </p>
      </div>
    </div>
  );
}
