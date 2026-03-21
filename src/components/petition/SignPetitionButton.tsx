"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Textarea } from "@/components/ui/textarea";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignPetitionButtonProps {
  alreadySigned: boolean;
}

export function SignPetitionButton({ alreadySigned }: SignPetitionButtonProps) {
  const { user } = useSession();
  const [signed, setSigned] = useState(alreadySigned);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          Sign in with your Steam account to sign the petition.
        </p>
        <a
          href="/api/auth/steam/login"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-cs-orange hover:bg-cs-orange-light text-background font-heading font-bold text-lg px-8 cs-pulse-glow"
          )}
        >
          <Shield className="h-5 w-5 mr-2" />
          Sign in via Steam
        </a>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-cs-green text-lg font-heading">
          <CheckCircle className="h-6 w-6" />
          You have signed the petition
        </div>
        <p className="text-muted-foreground text-sm">
          Thank you for adding your voice, {user.name}!
        </p>
      </div>
    );
  }

  async function handleSign() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/petition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign petition");
      }
      setSigned(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {!showMessage ? (
        <div className="space-y-3 text-center">
          <Button
            onClick={() => setShowMessage(true)}
            size="lg"
            className="bg-cs-orange hover:bg-cs-orange-light text-background font-heading font-bold text-lg px-8 cs-pulse-glow"
          >
            <Shield className="h-5 w-5 mr-2" />
            Sign as {user.name}
          </Button>
          <p className="text-xs text-muted-foreground">
            Click to sign, optionally add a personal message
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            placeholder="Add an optional message (max 500 chars)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            className="bg-muted/50 border-border resize-none"
            rows={3}
          />
          <div className="flex gap-3">
            <Button
              onClick={handleSign}
              disabled={loading}
              className="flex-1 bg-cs-orange hover:bg-cs-orange-light text-background font-heading font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Confirm Signature
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowMessage(false)}
              className="border-border"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-cs-red text-sm text-center">{error}</p>
      )}
    </div>
  );
}
