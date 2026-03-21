import type { Metadata } from "next";
import { Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Video Wall",
  description: "Community-submitted clips of cheaters in Counter-Strike 2.",
};

export default function VideosPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <Video className="h-16 w-16 text-cs-blue mx-auto mb-6 opacity-50" />
        <h1 className="font-heading text-4xl font-bold mb-4">
          VIDEO <span className="text-cs-blue">WALL</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Coming soon. Share and browse clips of cheaters ruining CS2 matches.
        </p>
      </div>
    </div>
  );
}
