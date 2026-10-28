"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/** Copies `text` to the clipboard; the label reads "Copied" for two seconds afterwards. */
export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure context or permissions): leave the label unchanged.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(buttonVariants({ variant: "ghost" }), "min-h-9 text-[13px]", className)}
    >
      {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
