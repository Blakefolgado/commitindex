"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className="outline-button" onClick={share} type="button">
      {copied ? <Check aria-hidden="true" size={15} /> : <Share2 aria-hidden="true" size={15} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
