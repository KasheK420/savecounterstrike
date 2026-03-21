import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MediaSubmitForm } from "@/components/media/MediaSubmitForm";

export const metadata: Metadata = {
  title: "Submit Media",
  description: "Share a video, clip, or post with the CS2 community.",
};

export default function MediaSubmitPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/media"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Media Wall
        </Link>

        <h1 className="font-heading text-3xl font-bold mb-2">
          SUBMIT <span className="text-cs-blue">MEDIA</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Share YouTube videos, Twitch clips, tweets, TikToks, Instagram posts,
          or any link related to CS2.
        </p>

        <div className="cs-card rounded-lg p-6">
          <MediaSubmitForm />
        </div>
      </div>
    </div>
  );
}
