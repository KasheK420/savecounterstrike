import type { Metadata } from "next";
import { SignaturesTable } from "@/components/petition/SignaturesTable";

export const metadata: Metadata = {
  title: "All Signatures",
  description:
    "View all petition signatures from the CS2 community demanding better anti-cheat.",
};

export default function SignaturesPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            ALL <span className="text-cs-orange cs-glow">SIGNATURES</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
            Every voice counts. Privacy-protected view of all petition signers.
          </p>
        </div>
        <SignaturesTable />
      </div>
    </div>
  );
}
