"use client";

import { useState } from "react";
import { Mail, User, MessageSquare, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send message");
        return;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="cs-card p-12">
          <CheckCircle className="h-16 w-16 text-cs-green mx-auto mb-6" />
          <h1 className="font-heading text-3xl font-bold text-cs-orange mb-4">
            Message Sent
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for reaching out. We&apos;ll get back to you as soon as
            possible.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="cs-btn cs-btn-md"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-cs-orange mb-3">
          Contact Us
        </h1>
        <p className="text-muted-foreground">
          Have questions, feedback, or want to collaborate? Send us a message.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="cs-card p-6 space-y-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-cs-orange" />
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-cs-dark px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cs-orange focus:outline-none focus:ring-1 focus:ring-cs-orange"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-cs-orange" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="w-full rounded-lg border border-border bg-cs-dark px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cs-orange focus:outline-none focus:ring-1 focus:ring-cs-orange"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="h-4 w-4 text-cs-orange" />
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={3}
            maxLength={200}
            placeholder="What is this about?"
            className="w-full rounded-lg border border-border bg-cs-dark px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cs-orange focus:outline-none focus:ring-1 focus:ring-cs-orange"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-cs-orange" />
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            placeholder="Your message..."
            className="w-full rounded-lg border border-border bg-cs-dark px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cs-orange focus:outline-none focus:ring-1 focus:ring-cs-orange resize-y"
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length} / 5000
          </p>
        </div>

        {error && (
          <p className="text-sm text-cs-red bg-cs-red/10 border border-cs-red/30 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="cs-btn cs-btn-md w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6">
        You can also reach us at{" "}
        <a
          href="mailto:contact@savecounterstrike.com"
          className="text-cs-orange hover:underline"
        >
          contact@savecounterstrike.com
        </a>
      </p>
    </div>
  );
}
