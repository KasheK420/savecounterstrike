"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "strong", "em", "u",
  "ul", "ol", "li", "a", "img", "blockquote",
  "br", "code", "pre", "hr",
];
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "width", "height"];
const ADD_ATTR = ["target"];

/**
 * Renders user-generated HTML safely using DOMPurify for client-side sanitization.
 * Content is also sanitized server-side via sanitize-html before storage.
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ADD_ATTR }),
    [html]
  );
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
