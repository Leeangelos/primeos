"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  fileName: string;
}

export function ShareButton({ targetRef, title, fileName }: ShareButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleShare = async () => {
    if (!targetRef.current) return;
    setGenerating(true);

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Clone the target and add branding
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Add PrimeOS branding to bottom of canvas
      const brandedCanvas = document.createElement("canvas");
      const ctx = brandedCanvas.getContext("2d");
      if (!ctx) return;

      const brandingHeight = 60;
      brandedCanvas.width = canvas.width;
      brandedCanvas.height = canvas.height + brandingHeight;

      // Draw original content
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, brandedCanvas.width, brandedCanvas.height);
      ctx.drawImage(canvas, 0, 0);

      // Draw branding bar
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, canvas.height, brandedCanvas.width, brandingHeight);

      // Draw branding text
      ctx.fillStyle = "#64748b";
      ctx.font = `${14 * 2}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("PrimeOS — The Operating System for Pizza", brandedCanvas.width / 2, canvas.height + 25 * 2);

      ctx.font = `${10 * 2}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = "#475569";
      ctx.fillText("© 2026 Ambition & Legacy LLC. All rights reserved.", brandedCanvas.width / 2, canvas.height + 45 * 2);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        brandedCanvas.toBlob(resolve, "image/png", 1.0);
      });

      if (!blob) throw new Error("Failed to create image");

      const file = new File([blob], `${fileName}.png`, { type: "image/png" });

      // Try native share first (mobile)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          text: `${title} — PrimeOS`,
          files: [file],
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // User cancelled share or error
      console.error("Share failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={generating}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
    >
      <Share2 className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
      <span>{generating ? "Generating..." : "Share"}</span>
    </button>
  );
}
