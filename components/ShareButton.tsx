"use client";

import { useState, type JSX } from "react";
import { Share2, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { ShareVisual } from "./ShareVisual";
import type { SessionSong } from "@/lib/api";

type ShareButtonProps = {
  songs: SessionSong[];
};

export function ShareButton({ songs }: ShareButtonProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    // Give a small delay for the off-screen element to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    const element = document.getElementById("share-visual");
    if (!element) {
      setIsGenerating(false);
      return;
    }

    try {
      const dataUrl = await toPng(element, {
        quality: 0.95,
        cacheBust: true,
        pixelRatio: 2, // High resolution
      });

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#ffffff"],
      });

      // Convert dataUrl to blob for sharing
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "my-top-10.png", { type: "image/png" });

      // Check for Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Top 10 Songs",
          text: "Check out my definitive top 10 songs on Song Ranker!",
        });
      } else {
        // Fallback to download
        const link = document.createElement("a");
        link.download = "my-top-10.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Failed to generate share image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={isGenerating}
        className="px-8 md:px-12 py-5 md:py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-widest text-[10px] md:text-xs font-black group relative overflow-hidden"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        )}
        {isGenerating ? "Generating..." : "Share Rankings"}
        
        {!isGenerating && (
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Button>

      {/* Hidden container for image generation */}
      <div className="fixed left-[-9999px] top-[-9999px]" aria-hidden="true">
        <ShareVisual songs={songs} />
      </div>
    </>
  );
}
